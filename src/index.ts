import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DISCORD_INVITE,
  IS_ALIVE,
  IS_DEVELOPMENT,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  NO_CACHE_CONTROL,
  SUPPORT_URL,
} from '@constants';
import { staticPlugin } from '@elysiajs/static';
import { apiPlugin } from '@routes/api';
import { authRoute } from '@routes/auth';
import { chatWebSocket } from '@routes/chat';
import { filesPlugin } from '@routes/files';
import { infoRoute } from '@routes/info';
import { jsonsRoute } from '@routes/jsons';
import { jwtPlugin } from '@routes/jwt';
import { statsRoute } from '@routes/stats';
import { syncRoute } from '@routes/sync';
import { webhooksPlugin } from '@routes/webhooks';
import { Elysia } from 'elysia';
import { chmod } from 'node:fs/promises';

// start sync service
import '@services/sync';
import { connectDB } from '@services/mongodb';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;
const unix = process.env.UNIX_SOCKET_PATH;

if (unix) {
  const file = Bun.file(unix);
  if (await file.exists()) {
    await file.unlink();
  }
}

export const app = new Elysia({
  serve: {
    maxRequestBodySize: 1.1 * MAX_CONTENT_LENGTH,
  },
  websocket: {
    perMessageDeflate: true,
    publishToSelf: true,
  },
})
  .use(async app => {
    await connectDB();
    if (IS_DEVELOPMENT) {
      // attach logger in development mode
      return app
        .onRequest(({ request: { method, url } }) => console.info(`${method} ${url}`))
        .onError(({ error }) => console.error(error));
    } else return app;
  })
  .onRequest(({ status, request: { body, headers } }) => {
    if (body === null) return;
    const contentLen = Number(headers.get('content-length'));
    if (!contentLen || contentLen < MIN_CONTENT_LENGTH) return status(400);
    if (+contentLen > MAX_CONTENT_LENGTH) return status(413);
  })
  .use(statsRoute)
  .use(jwtPlugin)
  .use(filesPlugin)
  .use(chatWebSocket)
  .use(syncRoute)
  .use(authRoute)
  .use(jsonsRoute)
  .use(apiPlugin)
  .use(infoRoute)
  .use(webhooksPlugin)
  .get('/isalive', ({ set }) => {
    set.headers['cache-control'] = NO_CACHE_CONTROL;
    return IS_ALIVE;
  })
  .all('/support', ctx => ctx.redirect(SUPPORT_URL, 303))
  .all('/discord', ctx => ctx.redirect(DISCORD_INVITE, 303))
  .use(await staticPlugin({ prefix: '/', alwaysStatic: true }))
  .listen(unix ? { unix } : { port, hostname }, server => {
    if (unix) chmod(unix, 0o666);
    console.log(`Server started at ${server.url}`);
  });
