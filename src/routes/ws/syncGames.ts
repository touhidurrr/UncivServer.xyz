import { getCachedGame } from '@lib';
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
    lastUpdatedList.map(async ({ gameId, lastUpdated }) => {
      const cachedGame = await getCachedGame(gameId);
      if (!cachedGame || lastUpdated < cachedGame.timestamp) return;
      ws.send({
        type: 'GameData',
        data: {
          gameId,
          content: cachedGame.text,
        },
      });
    })
  );
}
