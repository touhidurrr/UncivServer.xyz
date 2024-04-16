import bearer from '@elysiajs/bearer';
import { isValidBearer } from '@lib';
import cache from '@services/cache';
import type { Elysia } from 'elysia';

// for syncing with other servers
export const patchFile = (app: Elysia) =>
  app.use(bearer()).patch('/:gameId', async ({ set, error, bearer, body, params: { gameId } }) => {
    if (!isValidBearer(bearer)) {
      set.headers['WWW-Authenticate'] = `Bearer realm='sign', error="invalid_request"`;
      return error(401);
    }
    await cache.set(gameId, body as string);
    return 'Done!';
  });
