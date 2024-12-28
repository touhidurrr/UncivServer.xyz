import cache from '@services/cache';
import { db } from '@services/mongodb';
import prisma, { getGameWithPrima } from '@services/prisma';
import type { Elysia } from 'elysia';

export const getFile = (app: Elysia) =>
  app.get(
    '/:gameId',
    async ({ error, params: { gameId } }) => {
      const pGame = await getGameWithPrima(gameId);
      if (pGame) return pGame;

      const mGame = await db.UncivGame.findById(gameId, { _id: 0, text: 1 });
      if (!mGame) return error(404);

      const { text } = mGame;
      const isPreview = gameId.endsWith('_Preview');
      prisma.game.upsert({
        where: { id: gameId.replace('_Preview', '') },
        create: {
          id: gameId,
          save: isPreview ? '' : text,
          preview: isPreview ? text : undefined,
        },
        update: {
          updatedAt: Date.now(),
          save: isPreview ? undefined : text,
          preview: isPreview ? text : undefined,
        },
      });

      await cache.set(gameId, text);
      return text;
    },
    {
      beforeHandle: async ({ params: { gameId } }) => {
        const cachedResponse = await cache.get(gameId);
        if (cachedResponse) return cachedResponse;
      },
    }
  );
