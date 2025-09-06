import { Elysia, t } from 'elysia';
import { getFile } from './get';
import { putFile } from './put';

import { GAME_ID_REGEX } from '@constants';

// Notes: deleteFile not imported for safety reasons

export const filesPlugin = new Elysia({ name: 'files', prefix: 'files' }).guard(
  {
    parse: 'text',
    params: t.Object({ gameId: t.RegExp(GAME_ID_REGEX) }),
  },
  app => app.use(getFile).use(putFile)
);
