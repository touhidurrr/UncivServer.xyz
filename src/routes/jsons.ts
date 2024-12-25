import { GAME_ID_WITH_PREVIEW_REGEX } from '@constants';
import cache from '@services/cache';
import { db } from '@services/mongodb';
import { unpackJSON } from '@services/uncivGame';
import { Elysia, t } from 'elysia';

export const jsonsRoute = new Elysia().get(
  '/jsons/:gameId',
  async ({ error, set, params: { gameId } }) => {
    set.headers['content-type'] = 'application/json';

    const cachedGame = await cache.get(gameId);
    if (cachedGame) return unpackJSON(cachedGame.text);

    const dbGame = await db.UncivGame.findById(gameId, { _id: 0, text: 1, timestamp: 1 });
    if (!dbGame) return error(404);

    await cache.set(gameId, { text: dbGame.text, timestamp: dbGame.timestamp });
    return unpackJSON(dbGame.text);
  },
  {
    params: t.Object({ gameId: t.RegExp(GAME_ID_WITH_PREVIEW_REGEX) }),
  }
);
