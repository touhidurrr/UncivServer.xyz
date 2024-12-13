import { generateRandomNotification, getCurrentPlayerCivilization } from '@lib';
import type { UncivJSON } from '@localTypes/unciv';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import { syncGame } from '@services/sync';
import { pack, unpack } from '@services/uncivGame';
import { type Elysia } from 'elysia';
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
      // afterHandle is called after the route handler is executed but before the response is sent
      // do not use any synchronous code here as it will block the response
      // this notice is only valid for this file, not for the entire project
      afterHandle: async ({ body, server, params: { gameId }, store: { game } }) => {
        // save on mongodb
        db.UncivServer.updateOne(
          { _id: gameId },
          { $set: { timestamp: Date.now(), text: body as string } },
          { upsert: true }
        ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

        // sync with other servers
        syncGame(gameId, body as string);

        if (game !== null) {
          const isPreview = gameId.endsWith('_Preview');
          // send turn notification
          if (isDiscordTokenValid && isPreview) {
            sendNewTurnNotification(game!);
          }

          // publish game data to connected clients
          if (!isPreview) {
            const wsMsg = JSON.stringify({
              type: 'GameUpdate',
              data: { gameId, content: body },
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
