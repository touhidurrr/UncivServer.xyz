import { GAME_ID_REGEX } from '@constants';
import cache from '@services/cache';
import { db } from '@services/mongodb';
import { unpack } from '@services/uncivGame';
import { Elysia, t } from 'elysia';

const unpackedJSON = (gameData: string) => JSON.stringify(unpack(gameData), null, 2);

export const jsonsRoute = new Elysia().get(
  '/jsons/:gameId',
  async ({ error, set, params: { gameId } }) => {
    set.headers['content-type'] = 'application/json';

    const gameData = await cache.get(gameId);
    if (gameData) return unpackedJSON(gameData);

    const dbGame = await db.UncivServer.findOne(
      { _id: gameId },
      { projection: { _id: 0, text: 1 } }
    );
    if (!dbGame) return error(404);

    await cache.set(gameId, dbGame.text);
    return unpackedJSON(dbGame.text);
  },
  {
    params: t.Object({ gameId: t.RegExp(GAME_ID_REGEX) }),
  }
);
