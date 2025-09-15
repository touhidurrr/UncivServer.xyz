import { GAME_ID_SCHEMA } from '@constants';
import { type } from 'arktype';
import { Elysia } from 'elysia';
import { getFile } from './get';
import { putFile } from './put';

// Notes: deleteFile not imported for safety reasons

export const filesPlugin = new Elysia({ name: 'files', prefix: 'files' }).guard(
  {
    parse: 'text',
    params: type({ gameId: GAME_ID_SCHEMA }),
  },
  app => app.use(getFile).use(putFile)
);
