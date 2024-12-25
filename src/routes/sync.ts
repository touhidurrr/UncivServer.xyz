import { GAME_ID_WITH_PREVIEW_REGEX } from '@constants';
import { type Elysia, t } from 'elysia';

const SYNC_GAME_DATA_SCHEMA = t.Object({
  type: t.Literal('SyncData'),
  data: t.Object({ gameId: t.RegExp(GAME_ID_WITH_PREVIEW_REGEX), content: t.String() }),
});

const SYNC_ERROR_SCHEMA = t.Object({
  type: t.Literal('AuthError'),
});

export const SYNC_RESPONSE_SCHEMA = t.Union([SYNC_GAME_DATA_SCHEMA, SYNC_ERROR_SCHEMA]);

export const syncRoute = (app: Elysia) =>
  app.ws('/sync', {
    headers: t.Object({ authorization: t.RegExp('^Bearer .+$') }),
    response: SYNC_RESPONSE_SCHEMA,
    open: ws => {
      const token = ws.data.headers.authorization.replace('Bearer ', '');
      if (token !== process.env.SYNC_TOKEN) {
        ws.send({ type: 'AuthError' }, true);
        ws.close();
        return;
      }
      ws.subscribe('sync');
    },
  });
