import type { Elysia } from 'elysia';
import { db } from '@services/mongodb';
import { syncGame } from '@services/sync';
import { cache } from '@services/lrucache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';

export const putFile = (app: Elysia) =>
  app.put(
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
      afterHandle: async ({ body, params: { gameId } }) => {
        // save on mongodb
        db.UncivServer.updateOne(
          { _id: gameId },
          { $set: { timestamp: Date.now(), text: body as string } },
          { upsert: true }
        ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

        // sync with other servers
        syncGame(gameId, body as string);

        // send turn notification
        if (isDiscordTokenValid && gameId.endsWith('_Preview')) {
          sendNewTurnNotification(body as string);
        }
      },
    }
  );
