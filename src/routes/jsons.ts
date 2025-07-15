import { GAME_ID_WITH_PREVIEW_REGEX } from '@constants';
import cache from '@services/cache';
import { db } from '@services/mongodb';
import { unpackJSON } from '@services/uncivJSON';
import { stringify } from 'cache-control-parser';
import { type Elysia, t } from 'elysia';

const CACHE_CONTROL = stringify({
  public: true,
  immutable: true,
  'max-age': 10,
  'stale-while-revalidate': 100,
});

export const jsonsRoute = (app: Elysia) =>
  app.get(
    '/jsons/:gameId',
    async ({ status, set, params: { gameId } }) => {
      set.headers['content-type'] = 'application/json';
      set.headers['cache-control'] = CACHE_CONTROL;

      const gameData = await cache.get(gameId);
      if (gameData) return unpackJSON(gameData);

      const dbGame = await db.UncivGame.findById(gameId, { _id: 0, text: 1 });
      if (!dbGame) return status(404);

      await cache.set(gameId, dbGame.text);
      return unpackJSON(dbGame.text);
    },
    {
      params: t.Object({ gameId: t.RegExp(GAME_ID_WITH_PREVIEW_REGEX) }),
    }
  );
