import { MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';
import { generateRandomNotification, getCurrentPlayerCivilization } from '@lib';
import type { UncivJSON } from '@localTypes/unciv';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import prisma from '@services/prisma';
import { pack, unpack } from '@services/uncivGame';
import { type Elysia, type Static, t } from 'elysia';
import random from 'random';

export const putFile = (app: Elysia) =>
  // ctx.game should contain parsed game data
  // ctx.game is null if parsing fails
  app.state('game', null as UncivJSON | null).put(
    '/:gameId',
    async ({ body, params: { gameId } }) => {
      // for performance reasons, just store the file in cache and return ok
      // try to do everything else asynchronously in afterHandle
      await cache.set(gameId, body as string);
      return 'Done!';
    },
    {
      // body schema
      body: t.String({
        minLength: MIN_FILE_SIZE,
        maxLength: MAX_FILE_SIZE,
        format: 'byte',
      }),
      // afterHandle is called after the route handler is executed but before the response is sent
      // do not use any synchronous code here as it will block the response
      // this notice is only valid for this file, not for the entire project
      afterHandle: async ({ body, server, params: { gameId }, store: { game } }) => {
        // save on mongodb
        db.UncivGame.updateOne(
          { _id: gameId },
          { $set: { text: body as string } },
          { upsert: true }
        ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

        const isPreview = gameId.endsWith('_Preview');

        prisma.game
          .upsert({
            where: { id: gameId.replace('_Preview', '') },
            create: {
              id: gameId,
              save: isPreview ? '' : body,
              ...(isPreview && { preview: body }),
            },
            update: { updatedAt: Date.now(), ...(isPreview ? { preview: body } : { save: body }) },
          })
          .then(() => {
            // Unique list of Players
            if (!game || (game.turns && game.turns > 0)) return;
            const players = [
              ...new Set(
                [
                  ...game.civilizations?.map(c => c.playerId),
                  ...game.gameParameters?.players.map(p => p.playerId),
                ].filter(Boolean)
              ),
            ] as string[];

            return Promise.all(
              players.map(playerId =>
                prisma.user.upsert({
                  where: { id: playerId },
                  create: {
                    id: playerId,
                    games: {
                      connect: { userId_gameId: { userId: playerId, gameId: game.gameId } },
                    },
                  },
                  update: {
                    games: {
                      connect: { userId_gameId: { userId: playerId, gameId: game.gameId } },
                    },
                  },
                })
              )
            );
          })
          .catch(err => console.error(`[Prisma] Error saving game ${gameId}:`, err));

        // sync with other servers
        server?.publish(
          'sync',
          JSON.stringify({
            type: 'SyncData',
            data: { gameId, content: body },
          } as Static<typeof SYNC_RESPONSE_SCHEMA>),
          true
        );

        // send turn notification
        if (game !== null && isDiscordTokenValid && isPreview) {
          sendNewTurnNotification(game!);
        }
      },

      // parsing game data to populate ctx.store.game
      // used for notifications, security provider and discord notifications
      // in case an injection is possible, we need to repack the body to update it
      transform: ctx => {
        // need to think of a better way of doing this
        // ideally there should be no try-catch here
        // if parsing fails then we should just let it happen
        // this way bad game data will not be saved
        // but current tests are not good enough to ensure this
        try {
          ctx.store.game = unpack(ctx.body as string);

          // run security modifier on game data
          const hasModifications = gameDataSecurityModifier(ctx.store.game);

          // notifications provider
          let hasNotifications = false;
          if (
            !ctx.params.gameId.endsWith('_Preview') &&
            ctx.store.game.version.number >= 4 &&
            ctx.store.game.version.createdWith.number > 1074 &&
            // 52.5% chance of a notification being shown per turn
            // weighted average of a poll in Unciv the discord server
            // decreased to 10% at least for this year because yair thinks it's too much
            random.float() < 0.1
          ) {
            hasNotifications = true;
            const targetCiv = getCurrentPlayerCivilization(ctx.store.game);
            if (targetCiv) {
              const newNotification = generateRandomNotification(ctx.store.game);
              if (targetCiv.notifications) targetCiv.notifications.push(newNotification);
              else targetCiv.notifications = [newNotification];
            }
          }

          // repack game data if there are modifications or notifications
          if (hasModifications || hasNotifications) {
            ctx.body = pack(ctx.store.game);
          }
        } catch (err) {
          console.error(`[PutBodyTransformError]:\n`, err);
        }
      },
    }
  );
