import { GAME_ID_REGEX } from '@constants';
import { Elysia } from 'elysia';
import { z } from 'zod';
import { getFile } from './get';
import { putFile } from './put';

// Notes: deleteFile not imported for safety reasons

export const filesPlugin = new Elysia({ name: 'files', prefix: 'files' }).guard(
  {
    parse: 'text',
    params: z.object({ gameId: z.string().regex(GAME_ID_REGEX) }),
  },
  app => app.use(getFile).use(putFile)
);
