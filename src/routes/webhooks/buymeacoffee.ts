import type { BMCWebhookEvent } from '@localTypes/buymeacoffee';
import { HMAC } from '@models/hmac';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

export const bmcRoute = (app: Elysia) => {
  const { BUYMEACOFFEE_WEBHOOK_SECRET } = process.env;
  if (!BUYMEACOFFEE_WEBHOOK_SECRET) return app;

  const hmac = new HMAC(BUYMEACOFFEE_WEBHOOK_SECRET, 'sha256', 'hex');

  return app.post(
    'buymeacoffee',
    async ({ body: data, status, headers: { 'x-signature-sha256': signature } }) => {
      if (!hmac.verify(signature, data)) return status(401);

      const event = JSON.parse(data) as BMCWebhookEvent;
      if (!event.live_mode) {
        console.dir(event, { depth: null });
        Bun.write('.webhook.yaml', Bun.YAML.stringify(event, null, 2));
        return status(200);
      }
    },
    {
      parse: 'text',
      body: type.string,
      headers: type({ 'x-signature-sha256': 'string' }),
    }
  );
};
