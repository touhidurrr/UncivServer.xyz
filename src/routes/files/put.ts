import { MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';
import { generateRandomNotification, getCurrentPlayerCivilization } from '@lib';
import { getWSMessageString } from '@lib/getWSMessageString';
import type { UncivJSON } from '@localTypes/unciv';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import { pack, unpack } from '@services/uncivGame';
import { type Elysia, type Static, t } from 'elysia';
import random from 'random';
import type { CachedGame } from '../../models/cache';

export const putFile = (app: Elysia) =>
  // ctx.game should contain parsed game data
  // ctx.game is null if parsing fails
  app
    .state('game', null as UncivJSON | null)
    .state('cachedGame', null as CachedGame | null)
    .put(
      '/:gameId',
      async ({ body, store, params: { gameId } }) => {
        // for performance reasons, just store the file in cache and return ok
        // try to do everything else asynchronously in afterHandle
        store.cachedGame = {
          text: body,
          timestamp: Date.now(),
        };
        await cache.set(gameId, store.cachedGame);
        return 'Done!';
      },
      {
        // body schema
        body: t.String({
          minLength: MIN_FILE_SIZE,
          maxLength: MAX_FILE_SIZE,
          format: 'byte',
        }),
        // afterResponse is called after the route handler is executed but before the response is sent
        // do not use any synchronous code here as it will block the response
        // this notice is only valid for this file, not for the entire project
        afterResponse: async ({ server, params: { gameId }, store: { game, cachedGame } }) => {
          // save on mongodb
          const { text, timestamp } = cachedGame!;
          await db.UncivGame.updateOne(
            { _id: gameId },
            { $set: { text, timestamp } },
            { upsert: true }
          ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

          // sync with other servers
          server?.publish(
            'sync',
            JSON.stringify({
              type: 'SyncData',
              data: { gameId, content: text },
            } as Static<typeof SYNC_RESPONSE_SCHEMA>),
            true
          );

          // send new turn notification
          if (game !== null) {
            if (gameId.endsWith('_Preview')) {
              if (isDiscordTokenValid) {
                await sendNewTurnNotification(game);
              }
            } else {
              // publish game data to connected clients
              const wsMsg = getWSMessageString({
                type: 'GameData',
                data: { gameId, content: text },
              });

              game.gameParameters.players.forEach(({ playerId }) => {
                server!.publish(`user:${playerId}`, wsMsg);
              });
            }
          }
        },

        // parsing game data to populate ctx.store.game
        // used for notifications, security provider and discord notifications
        // in case an injection is possible, we need to repack the body to update it
        transform: ctx => {
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
        },
      }
    );
