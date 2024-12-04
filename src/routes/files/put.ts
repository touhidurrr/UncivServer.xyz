import { generateRandomNotification } from '@lib';
import { getCurrentPlayerCivilization } from '@lib/getCurrentPlayerCivilization';
import type { UncivJSON } from '@localTypes/unciv';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { db } from '@services/mongodb';
import { syncGame } from '@services/sync';
import { pack, unpack } from '@services/uncivGame';
import { type Elysia } from 'elysia';

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
      afterHandle: async ({ body, params: { gameId }, store: { game } }) => {
        // save on mongodb
        db.UncivServer.updateOne(
          { _id: gameId },
          { $set: { timestamp: Date.now(), text: body as string } },
          { upsert: true }
        ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

        // sync with other servers
        syncGame(gameId, body as string);

        // send turn notification
        if (game !== null && isDiscordTokenValid && gameId.endsWith('_Preview')) {
          sendNewTurnNotification(game!);
        }
      },

      // used for injecting notifications
      // in case an injection is possible, we need to repack the body to update it
      transform: ctx => {
        if (ctx.params.gameId.endsWith('_Preview')) return;
        // need to think of a better way of doing this
        // ideally there should be no try-catch here
        // if parsing fails then we should just let it happen
        // this way bad game data will not be saved
        // but current tests are not good enough to ensure this
        try {
          ctx.store.game = unpack(ctx.body as string);
          if (
            ctx.store.game.version.number >= 4 &&
            ctx.store.game.version.createdWith.number > 1074
          ) {
            const targetCiv = getCurrentPlayerCivilization(ctx.store.game);
            if (targetCiv) {
              const newNotification = generateRandomNotification(ctx.store.game);
              if (targetCiv.notifications) targetCiv.notifications.push(newNotification);
              else targetCiv.notifications = [newNotification];
              ctx.body = pack(ctx.store.game);
            }
          }
        } catch (err) {
          console.error(`[PutBodyTransformError]:\n`, err);
        }
      },
    }
  );
