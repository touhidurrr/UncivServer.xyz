import { format } from 'bytes';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { Elysia } from 'elysia';

export const infoPlugin = (app: Elysia) =>
  app.get('/info', () => {
    const uptime = process.uptime();
    const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
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
