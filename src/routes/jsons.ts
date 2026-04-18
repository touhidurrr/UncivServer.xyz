import filesCache from '@cache/filesCache';
import { GAME_ID_SCHEMA } from '@constants';
import { UncivGame } from '@models/UncivGame';
import { unpackJSON } from '@services/uncivJSON';
import { type } from 'arktype';
import { stringify } from 'cache-control-parser';
import type { Elysia } from 'elysia';

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
      set.headers['cache-control'] = CACHE_CONTROL;
      set.headers['content-type'] = 'application/json';

      const cachedGame = filesCache.get(gameId);
      if (cachedGame) return unpackJSON(cachedGame);

      const dbGame = await UncivGame.findById(gameId, { _id: 0, text: 1 }).lean();
      if (!dbGame) {
        set.headers['content-type'] = 'text/plain';
        return status(404);
      }

      filesCache.set(gameId, dbGame.text);
      return unpackJSON(dbGame.text);
    },
    { params: type({ gameId: GAME_ID_SCHEMA }) }
  );
