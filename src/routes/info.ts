import { format } from 'bytes';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Elysia } from 'elysia';

export const infoPlugin = new Elysia().get('/info', () => {
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  return {
    memory: {
      rss: format(memory.rss),
      heapTotal: format(memory.heapTotal),
      heapUsed: format(memory.heapUsed),
      external: format(memory.external),
    },
    uptime: formatDistanceToNow(new Date(Date.now() - uptime * 1000), { includeSeconds: true }),
  };
});
