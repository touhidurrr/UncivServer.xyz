import { HMAC } from '@models/hmac';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

export const patreonRoute = (app: Elysia) => {
  const { PATREON_WEBHOOK_SECRET } = process.env;
  if (!PATREON_WEBHOOK_SECRET) return app;

  const hmac = new HMAC(PATREON_WEBHOOK_SECRET, 'md5', 'hex');

  return app.post(
    'patreon',
    async ({ body: data, status, headers: { 'x-patreon-signature': signature } }) => {
      if (!hmac.verify(signature, data)) return status(401);

      const event = JSON.parse(data);
      Bun.write('.webhook.yaml', Bun.YAML.stringify(event, null, 2));
    },
    {
      parse: 'text',
      body: type.string,
      headers: type({ 'x-patreon-signature': 'string' }),
    }
  );
};
