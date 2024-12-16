import cache from '@services/cache';
import { db } from '@services/mongodb';
import type { Static, UnwrapRoute } from 'elysia';
import type { ElysiaWS } from 'elysia/ws';
import type { WS_BODY_SYNC_GAMES, WS_HEADERS_SCHEMA, WS_RESPONSE_SCHEMA } from './constants';

export async function syncGames(
  ws: ElysiaWS<
    any,
    UnwrapRoute<
      {
        body: typeof WS_BODY_SYNC_GAMES;
        response: typeof WS_RESPONSE_SCHEMA;
        headers: typeof WS_HEADERS_SCHEMA;
        open: unknown;
        message: unknown;
      },
      {}
    >,
    any
  >,
  lastUpdatedList: Static<typeof WS_BODY_SYNC_GAMES>['data']['lastUpdatedList']
) {
  await Promise.allSettled(
    lastUpdatedList.map(({ gameId, lastUpdated }) =>
      cache.get(gameId).then(async cachedGame => {
        // if cache not found
        if (!cachedGame) {
          // search gameId in db if lastUpdated > timestamp
          const game = await db.UncivServer.findOne(
            { _id: gameId, timestamp: { $gt: lastUpdated } },
            { projection: { _id: 0, text: 1, timestamp: 1 } }
          );

          // if such a game is not found then we return
          // this allows us not to populated cache with games that are not required at this moment
          if (!game) return;

          // if found, set cachedGame and return
          cachedGame = { text: game.text, timestamp: game.timestamp };
          await cache.set(gameId, cachedGame);
        }

        // at this point we have a cachedGame or already returned
        // if the cachedGame is not newer than lastUpdated, we return
        if (!(cachedGame.timestamp > lastUpdated)) return;

        // finally send the game data to the client
        ws.send({
          type: 'GameData',
          data: { gameId, content: cachedGame.text },
        });
      })
    )
  );
}
