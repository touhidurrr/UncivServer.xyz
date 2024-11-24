import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  isDevelopment,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  SUPPORT_URL,
} from '@constants';
import { staticPlugin } from '@elysiajs/static';
import { filesRoute } from '@routes/files';
import { infoPlugin } from '@routes/info';
import { Elysia } from 'elysia';

const port = process.env.PORT ?? DEFAULT_PORT;
const hostname = process.env.HOST ?? DEFAULT_HOST;

export const app = new Elysia()
  .onRequest(({ request, error }) => {
    if (isDevelopment) console.info(`${request.method} ${request.url}`);
    if (request.body !== null) {
      const contentLen = Number(request.headers.get('content-length'));
      if (!contentLen || contentLen < MIN_CONTENT_LENGTH) return error(400);
      if (+contentLen > MAX_CONTENT_LENGTH) return error(413);
    }
  })
  .use(staticPlugin({ prefix: '/' }))
  .use(infoPlugin)
  .get('/isalive', true)
  .all('/support', ctx => ctx.redirect(SUPPORT_URL, 303))
  .use(filesRoute)
  .listen({ port, hostname });

console.log(`Server started at ${app.server?.url}`);
