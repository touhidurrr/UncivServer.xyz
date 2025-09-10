import { GAME_ID_REGEX, NO_CACHE_CONTROL } from '@constants';
import { isValidSyncToken } from '@lib';
import { type Elysia, t } from 'elysia';

const SYNC_GAME_DATA_SCHEMA = t.Object({
  type: t.Literal('SyncData'),
  data: t.Object({ gameId: t.RegExp(GAME_ID_REGEX), content: t.String() }),
});

const SYNC_ERROR_SCHEMA = t.Object({
  type: t.Literal('AuthError'),
});

export const SYNC_RESPONSE_SCHEMA = t.Union([SYNC_GAME_DATA_SCHEMA, SYNC_ERROR_SCHEMA]);

export const syncRoute = (app: Elysia) =>
  app.ws('/sync', {
    headers: t.Object({ authorization: t.RegExp(/^bearer\s+/i, {}) }),
    response: SYNC_RESPONSE_SCHEMA,
    beforeHandle: ({ set }) => {
      set.headers['cache-control'] = NO_CACHE_CONTROL;
    },
    open: ws => {
      const token = ws.data.headers.authorization.replace(/^bearer\s+/i, '').trimEnd();
      if (!isValidSyncToken(token)) {
        ws.send({ type: 'AuthError' });
        ws.close();
        return;
      }
      ws.subscribe('sync');
    },
  });
