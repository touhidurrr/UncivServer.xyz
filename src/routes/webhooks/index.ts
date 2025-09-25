import { Elysia } from 'elysia';
import { bmcRoute } from './buymeacoffee';
import { patreonRoute } from './patreon';

export const webhooksPlugin = new Elysia({ name: 'webhooks', prefix: 'webhooks' })
  .use(patreonRoute)
  .use(bmcRoute);
