import { Elysia } from 'elysia';
import { patreonRoute } from './patreon';
import { bmcRoute } from './buymeacoffee';

export const webhooksPlugin = new Elysia({ name: 'webhooks', prefix: 'webhooks' })
  .use(patreonRoute)
  .use(bmcRoute);
