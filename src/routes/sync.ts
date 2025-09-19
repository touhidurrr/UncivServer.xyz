import { BEARER_TOKEN_SCHEMA, GAME_ID_SCHEMA, NO_CACHE_CONTROL } from '@constants';
import { isValidSyncToken } from '@lib';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

const SYNC_GAME_DATA_SCHEMA = type({
  type: "'SyncData'",
  data: {
    gameId: GAME_ID_SCHEMA,
    content: 'string',
  },
});

const SYNC_ERROR_SCHEMA = type({ type: "'AuthError'" });

export const SYNC_RESPONSE_SCHEMA = SYNC_GAME_DATA_SCHEMA.or(SYNC_ERROR_SCHEMA);

export const syncRoute = (app: Elysia) =>
  app.ws('/sync', {
    headers: type({ authorization: BEARER_TOKEN_SCHEMA }),
    response: SYNC_RESPONSE_SCHEMA,
    beforeHandle: ({ set }) => {
      set.headers['cache-control'] = NO_CACHE_CONTROL;
    },
    open: ws => {
      if (!isValidSyncToken(ws.data.headers.authorization)) {
        ws.send({ type: 'AuthError' });
        ws.close();
        return;
      }
      ws.subscribe('sync');
    },
  });
