import { MINIMAL_CACHE_CONTROL } from '@constants';
import { dependencies, version } from '@package.json';
import { format } from 'bytes';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { Elysia } from 'elysia';

export const infoPlugin = (app: Elysia) =>
  app.get('/info', ({ set }) => {
    const uptime = process.uptime();
    const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
    set.headers['cache-control'] = MINIMAL_CACHE_CONTROL;
    return {
      version: {
        bun: Bun.version,
        server: version,
        elysia: dependencies.elysia,
      },
      memory: {
        rss: format(rss),
        heapTotal: format(heapTotal),
        heapUsed: format(heapUsed),
        external: format(external),
        arrayBuffers: format(arrayBuffers),
      },
      uptime: formatDistanceToNow(new Date(Date.now() - uptime * 1000), {
        includeSeconds: true,
      }),
    };
  });
