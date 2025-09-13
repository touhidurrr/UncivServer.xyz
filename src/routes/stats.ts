import { MINIMAL_CACHE_CONTROL } from '@constants';
import type { Elysia } from 'elysia';

const stats: { [route: string]: number } = {};
const pathStart = /(?<=\/\/[^/]+)\/[^/]*/;

export const statsRoute = (app: Elysia) =>
  app
    .onRequest(({ request: { method, url } }) => {
      let key = `${method} ${pathStart.exec(url)![0]}`;
      if (key.endsWith('/files')) {
        if (url.endsWith('_Preview')) key += ' (preview)';
        else key += ' (full)';
      }
      stats[key] = (stats[key] ?? 0) + 1;
    })
    .get('/stats', ({ set }) => {
      set.headers['cache-control'] = MINIMAL_CACHE_CONTROL;
      return Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .map((o, i) => `${i + 1}. ${o[0]} (hits ${o[1]})`)
        .slice(0, 100)
        .join('\n');
    });
