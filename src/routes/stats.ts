import { type Elysia } from 'elysia';

const stats: { [route: string]: number } = {};
const pathStart = /(?<=\/\/[^/]+)\/[^/]*/;

export const statsPlugin = (app: Elysia) =>
  app
    .onRequest(({ request: { method, url } }) => {
      const key = `${method} ${pathStart.exec(url)![0]}`;
      stats[key] = (stats[key] ?? 0) + 1;
    })
    .get('/stats/', () =>
      Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .map((o, i) => `${i + 1}. ${o[0]} (hits ${o[1]})`)
        .join('\n')
    );
