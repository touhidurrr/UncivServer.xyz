import { db } from '@services/mongodb';
import cache from '@services/cache';
import type { Elysia } from 'elysia';

export const getFile = (app: Elysia) =>
  app.get(
    '/:gameId',
    async ({ error, params: { gameId } }) => {
      const game = await db.UncivServer.findOne(
        { _id: gameId },
        { projection: { _id: 0, text: 1 } }
      );

      if (!game) return error(404);

      await cache.set(gameId, game.text);
      return game.text;
    },
    {
      beforeHandle: async ({ params: { gameId } }) => {
        const cachedResponse = await cache.get(gameId);
        if (cachedResponse) return cachedResponse;
      },
    }
  );
