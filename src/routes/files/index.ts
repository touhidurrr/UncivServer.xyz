import { Elysia, t } from 'elysia';
import { getFile } from './get';
import { putFile } from './put';

import { GAME_ID_REGEX } from '@constants';

// Notes: deleteFile not imported for safety reasons

export const filesRoute = new Elysia({ prefix: '/files' }).guard(
  { params: t.Object({ gameId: t.RegExp(GAME_ID_REGEX) }) },
  app => app.use(getFile).use(putFile)
);
