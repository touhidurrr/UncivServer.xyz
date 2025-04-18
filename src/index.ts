import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DISCORD_INVITE,
  isDevelopment,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  NO_CACHE_CONTROL,
  SUPPORT_URL,
} from '@constants';
import { staticPlugin } from '@elysiajs/static';
import { swagger } from '@elysiajs/swagger';
import { authRoute } from '@routes/auth';
import { filesRoute } from '@routes/files';
import { infoPlugin } from '@routes/info';
import { jsonsRoute } from '@routes/jsons';
import { statsPlugin } from '@routes/stats';
import { syncRoute } from '@routes/sync';
import { Elysia } from 'elysia';
import { version } from '../package.json';

// start sync service
import './services/sync';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;

export const app = new Elysia({
  serve: { maxRequestBodySize: 1.1 * MAX_CONTENT_LENGTH },
  websocket: {
    perMessageDeflate: true,
  },
})
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: { title: 'UncivServer.xyz API', version },
      },
      exclude: /^(?!\/(ws|files|jsons))/,
    })
  )
  .use(statsPlugin)
  .onRequest(({ request, error }) => {
    if (isDevelopment) console.info(`${request.method} ${request.url}`);
    if (request.body !== null) {
      const contentLen = Number(request.headers.get('content-length'));
      if (!contentLen || contentLen < MIN_CONTENT_LENGTH) return error(400);
      if (+contentLen > MAX_CONTENT_LENGTH) return error(413);
    }
  })
  .use(filesRoute)
  .use(syncRoute)
  .use(authRoute)
  .use(jsonsRoute)
  .use(infoPlugin)
  .get('/isalive', ({ set }) => {
    set.headers['cache-control'] = NO_CACHE_CONTROL;
    return { authVersion: 1 };
  })
  .all('/support', ctx => ctx.redirect(SUPPORT_URL, 303))
  .all('/discord', ctx => ctx.redirect(DISCORD_INVITE, 303))
  .use(staticPlugin({ prefix: '/', alwaysStatic: true }))
  .listen({ port, hostname });

console.log(`Server started at ${app.server?.url}`);
