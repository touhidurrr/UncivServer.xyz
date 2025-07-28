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
import { authRoute } from '@routes/auth';
import { chatPlugin } from '@routes/chat';
import { filesRoute } from '@routes/files';
import { infoPlugin } from '@routes/info';
import { jsonsRoute } from '@routes/jsons';
import { statsPlugin } from '@routes/stats';
import { syncRoute } from '@routes/sync';
import { Elysia } from 'elysia';

// start sync service
import './services/sync';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;

// loggers for debugging in development
const devPlugin = (app: Elysia) => {
  if (!IS_DEVELOPMENT) return app;
  return app.onError(({ error }) => {
    console.error(error);
  });
};

export const app = new Elysia({
  serve: { maxRequestBodySize: 1.1 * MAX_CONTENT_LENGTH },
  websocket: {
    perMessageDeflate: true,
    publishToSelf: true,
  },
})
  .use(devPlugin)
  .use(statsPlugin)
  .onRequest(({ request, status }) => {
    if (IS_DEVELOPMENT) console.info(`${request.method} ${request.url}`);
    if (request.body !== null) {
      const contentLen = Number(request.headers.get('content-length'));
      if (!contentLen || contentLen < MIN_CONTENT_LENGTH) return status(400);
      if (+contentLen > MAX_CONTENT_LENGTH) return status(413);
    }
  })
  .use(filesRoute)
  .use(chatPlugin)
  .use(syncRoute)
  .use(authRoute)
  .use(jsonsRoute)
  .use(infoPlugin)
  .get('/isalive', ({ set }) => {
    set.headers['cache-control'] = NO_CACHE_CONTROL;
    return IS_ALIVE;
  })
  .all('/support', ctx => ctx.redirect(SUPPORT_URL, 303))
  .all('/discord', ctx => ctx.redirect(DISCORD_INVITE, 303))
  .use(staticPlugin({ prefix: '/', alwaysStatic: true }))
  .listen({ port, hostname });

console.log(`Server started at ${app.server?.url}`);
