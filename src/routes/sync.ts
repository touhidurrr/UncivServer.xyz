import { BEARER_TOKEN_SCHEMA, GAME_ID_REGEX, NO_CACHE_CONTROL } from '@constants';
import { isValidSyncToken } from '@lib';
import type { Elysia } from 'elysia';
import z from 'zod';

const SYNC_GAME_DATA_SCHEMA = z.object({
  type: z.literal('SyncData'),
  data: z.object({
    gameId: z.stringFormat('UncivGameFileName', GAME_ID_REGEX),
    content: z.string(),
  }),
});

const SYNC_ERROR_SCHEMA = z.object({
  type: z.literal('AuthError'),
});

export const SYNC_RESPONSE_SCHEMA = z.union([SYNC_GAME_DATA_SCHEMA, SYNC_ERROR_SCHEMA]);

export const syncRoute = (app: Elysia) =>
  app.ws('/sync', {
    headers: z.object({ authorization: BEARER_TOKEN_SCHEMA }),
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
