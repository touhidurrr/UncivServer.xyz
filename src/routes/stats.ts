import { stringify } from 'cache-control-parser';
import { type Elysia } from 'elysia';

const stats: { [route: string]: number } = {};
const pathStart = /(?<=\/\/[^/]+)\/[^/]*/;

const CACHE_CONTROL = stringify({
  public: true,
  immutable: true,
  'max-age': 1,
  'stale-while-revalidate': 10,
});

export const statsPlugin = (app: Elysia) =>
  app
    .onRequest(({ request: { method, url } }) => {
      const key = `${method} ${pathStart.exec(url)![0]}`;
      stats[key] = (stats[key] ?? 0) + 1;
    })
    .get('/stats/', ({ set }) => {
      set.headers['cache-control'] = CACHE_CONTROL;
      return Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .map((o, i) => `${i + 1}. ${o[0]} (hits ${o[1]})`)
        .slice(0, 100)
        .join('\n');
    });
