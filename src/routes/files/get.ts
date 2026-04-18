import filesCache from '@cache/filesCache';
import { MINIMAL_CACHE_CONTROL, NO_CACHE_CONTROL } from '@constants';
import { UncivGame } from '@models/UncivGame';
import type { Elysia } from 'elysia';

export const getFile = (app: Elysia) =>
  app.get(
    ':gameId',
    async ({ status, params: { gameId } }) => {
      const game = await UncivGame.findById(gameId, { _id: 0, text: 1 });

      if (!game || !game.text) return status(404);

      filesCache.set(gameId, game.text);
      return game.text;
    },
    {
      beforeHandle: async ({ params: { gameId }, set }) => {
        set.headers['cache-control'] = gameId.endsWith('_Preview')
          ? MINIMAL_CACHE_CONTROL
          : NO_CACHE_CONTROL;
        const cachedGame = filesCache.get(gameId);
        if (cachedGame) return cachedGame;
      },
    }
  );
