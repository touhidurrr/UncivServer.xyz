import { HMAC } from '@models/hmac';
import { type } from 'arktype';
import { Elysia } from 'elysia';

export const bmcRoute = (app: Elysia) => {
  const { BUYMEACOFFEE_WEBHOOK_SECRET } = process.env;
  if (!BUYMEACOFFEE_WEBHOOK_SECRET) return app;

  const hmac = new HMAC(BUYMEACOFFEE_WEBHOOK_SECRET, 'sha256', 'hex');

  return app.post(
    'buymeacoffee',
    async ({ body: data, status, headers: { 'x-signature-sha256': signature } }) => {
      const verified = hmac.verify(signature, data);
      if (!verified) return status(401);

      const event = JSON.parse(data);
      Bun.write('.webhook.yaml', Bun.YAML.stringify(event, null, 2));
    },
    {
      parse: 'text',
      body: type.string,
      headers: type({ 'x-signature-sha256': 'string' }),
    }
  );
};
