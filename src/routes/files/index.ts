import { Elysia, t } from 'elysia';
import { getFile } from './get';
import { patchFile } from './patch';
import { putFile } from './put';

import { GAME_ID_WITH_PREVIEW_REGEX, MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';

// Notes: deleteFile not imported for safety reasons

export const filesRoute = new Elysia({ prefix: '/files' }).guard(
  { params: t.Object({ gameId: t.RegExp(GAME_ID_WITH_PREVIEW_REGEX) }) },
  app =>
    app
      .use(getFile)
      .use(patchFile)
      .guard(
        {
          type: 'text',
          body: t.String({
            minLength: MIN_FILE_SIZE,
            maxLength: MAX_FILE_SIZE,
            format: 'byte',
          }),
        },
        app => app.use(putFile)
      )
);
