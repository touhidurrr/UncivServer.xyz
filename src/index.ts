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
import { filesRoute } from '@routes/files';
import { infoPlugin } from '@routes/info';
import { jsonsRoute } from '@routes/jsons';
import { statsPlugin } from '@routes/stats';
import { syncRoute } from '@routes/sync';
import { websocketsRoute } from '@routes/ws';
import { WS_MAX_PAYLOAD_LENGTH } from '@routes/ws/constants';
import { Elysia } from 'elysia';
import { version } from '../package.json';

// start sync service
import './services/sync';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;

export const app = new Elysia({
  websocket: {
    perMessageDeflate: true,
    maxPayloadLength: WS_MAX_PAYLOAD_LENGTH,
  },
})
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: { title: 'UncivServer.xyz API', version },
      },
      exclude: /^\/(?!ws|files|jsons)/,
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
  .use(websocketsRoute)
  .use(filesRoute)
  .use(syncRoute)
  .use(jsonsRoute)
  .use(infoPlugin)
  .get('/isalive', ({ set }) => {
    set.headers['cache-control'] = NO_CACHE_CONTROL;
    return true;
  })
  .all('/support', ctx => ctx.redirect(SUPPORT_URL, 303))
  .all('/discord', ctx => ctx.redirect(DISCORD_INVITE, 303))
  .use(staticPlugin({ prefix: '/', alwaysStatic: true }))
  .listen({ port, hostname });

console.log(`Server started at ${app.server?.url}`);
