import cache from '@services/cache';
import { db } from '@services/mongodb';
import { stringify } from 'cache-control-parser';
import type { Elysia } from 'elysia';

const CACHE_CONTROL = stringify({
  public: true,
  immutable: true,
  'max-age': 1,
  'stale-while-revalidate': 10,
});

export const getFile = (app: Elysia) =>
  app.get(
    '/:gameId',
    async ({ error, params: { gameId } }) => {
      const game = await db.UncivGame.findById(gameId, { _id: 0, text: 1 });

      if (!game) return error(404);

      await cache.set(gameId, game.text);
      return game.text;
    },
    {
      beforeHandle: async ({ params: { gameId }, set }) => {
        set.headers['cache-control'] = CACHE_CONTROL;
        const cachedResponse = await cache.get(gameId);
        if (cachedResponse) return cachedResponse;
      },
    }
  );
