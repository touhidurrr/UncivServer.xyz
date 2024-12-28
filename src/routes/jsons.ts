import { GAME_ID_WITH_PREVIEW_REGEX } from '@constants';
import cache from '@services/cache';
import { db } from '@services/mongodb';
import { getGameWithPrima } from '@services/prisma';
import { unpackJSON } from '@services/uncivGame';
import { type Elysia, t } from 'elysia';

export const jsonsRoute = (app: Elysia) =>
  app.get(
    '/jsons/:gameId',
    async ({ error, set, params: { gameId } }) => {
      set.headers['content-type'] = 'application/json';

      const cachedGame = await cache.get(gameId);
      if (cachedGame) return unpackJSON(cachedGame);

      const pGame = await getGameWithPrima(gameId);
      if (pGame) return unpackJSON(pGame);

      const mGame = await db.UncivGame.findById(gameId, { _id: 0, text: 1 });
      if (!mGame) return error(404);

      await cache.set(gameId, mGame.text);
      return unpackJSON(mGame.text);
    },
    {
      params: t.Object({ gameId: t.RegExp(GAME_ID_WITH_PREVIEW_REGEX) }),
    }
  );
