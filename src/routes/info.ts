import { format } from 'bytes';
import { stringify } from 'cache-control-parser';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { Elysia } from 'elysia';

const CACHE_CONTROL = stringify({
  public: true,
  immutable: true,
  'max-age': 1,
  'stale-while-revalidate': 10,
});

export const infoPlugin = (app: Elysia) =>
  app.get('/info', ({ set }) => {
    const uptime = process.uptime();
    const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
    set.headers['cache-control'] = CACHE_CONTROL;
    return {
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
