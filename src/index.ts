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
import './services/sync';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;
const unix = process.env.UNIX_SOCKET_PATH;

// loggers for debugging in development
const devPlugin = (app: Elysia) => {
  if (!IS_DEVELOPMENT) return app;
  return app.onError(({ error }) => {
    console.error(error);
  });
};

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
  .onRequest(({ request, status }) => {
    if (IS_DEVELOPMENT) console.info(`${request.method} ${request.url}`);
    if (request.body !== null) {
      const contentLen = Number(request.headers.get('content-length'));
      if (!contentLen || contentLen < MIN_CONTENT_LENGTH) return status(400);
      if (+contentLen > MAX_CONTENT_LENGTH) return status(413);
    }
  })
  .use(devPlugin)
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
  .use(staticPlugin({ prefix: '/', alwaysStatic: true }))
  .listen(unix ? { unix } : { port, hostname }, server => {
    if (unix) chmod(unix, 0o666);
    console.log(`Server started at ${server.url}`);
  });

// periodically run gc
setInterval(Bun.gc, 100_000);

