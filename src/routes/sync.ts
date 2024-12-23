import { GAME_ID_REGEX } from '@constants';
import { Elysia, t } from 'elysia';

const SYNC_GAME_DATA_SCHEMA = t.Object({
  type: t.Literal('SyncData'),
  data: t.Object({ gameId: t.RegExp(GAME_ID_REGEX), content: t.String() }),
});

const SYNC_ERROR_SCHEMA = t.Object({
  type: t.Literal('AuthError'),
});

export const SYNC_MESSAGE_SCHEMA = t.Union([SYNC_GAME_DATA_SCHEMA, SYNC_ERROR_SCHEMA]);

export const syncRoute = new Elysia().ws('/sync', {
  headers: t.Object({ authorization: t.RegExp('^Bearer .+$') }),
  messages: SYNC_MESSAGE_SCHEMA,
  open: ws => {
    const token = ws.data.headers.authorization.replace('Bearer ', '');
    if (token !== process.env.SYNC_TOKEN) {
      ws.send({ type: 'AuthError' }).close();
      return;
    }
    ws.subscribe('sync');
  },
});
