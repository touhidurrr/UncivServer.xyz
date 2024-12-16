import { MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';
import bearer from '@elysiajs/bearer';
import { isValidBearer } from '@lib';
import { getWSMessageString } from '@lib/getWSMessageString';
import cache from '@services/cache';
import { unpack } from '@services/uncivGame';
import { type Elysia, t } from 'elysia';

// for syncing with other servers
export const patchFile = (app: Elysia) =>
  app.use(bearer()).patch(
    '/:gameId',
    async ({ set, error, bearer, body, params: { gameId } }) => {
      if (!isValidBearer(bearer)) {
        set.headers['WWW-Authenticate'] = `Bearer realm='sign', error="invalid_request"`;
        return error(401);
      }
      await cache.set(gameId, body);
      return 'Done!';
    },
    {
      body: t.Object({
        timestamp: t.Number(),
        text: t.String({
          minLength: MIN_FILE_SIZE,
          maxLength: MAX_FILE_SIZE,
          format: 'byte',
        }),
      }),
      // send game data to connected clients
      afterHandle: async ({ body, server, params: { gameId } }) => {
        if (gameId.endsWith('_Preview')) return;
        try {
          const game = unpack(body.text);

          const wsMsg = getWSMessageString({
            type: 'GameData',
            data: { gameId, content: body.text },
          });

          game.gameParameters.players.forEach(({ playerId }) => {
            server!.publish(`user:${playerId}`, wsMsg);
          });
        } catch (error) {
          console.error(`[Patch] Error publishing game ${gameId}:`, error);
        }
      },
    }
  );
