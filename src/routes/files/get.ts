import cache from '@services/cache';
import { db } from '@services/mongodb';
import { getGameWithPrima } from '@services/prisma';
import type { Elysia } from 'elysia';

export const getFile = (app: Elysia) =>
  app.get(
    '/:gameId',
    async ({ error, params: { gameId } }) => {
      const pGame = await getGameWithPrima(gameId);
      if (pGame) return pGame;

      const mGame = await db.UncivGame.findById(gameId, { _id: 0, text: 1 });
      if (!mGame) return error(404);

      await cache.set(gameId, mGame.text);
      return mGame.text;
    },
    {
      beforeHandle: async ({ params: { gameId } }) => {
        const cachedResponse = await cache.get(gameId);
        if (cachedResponse) return cachedResponse;
      },
    }
  );
