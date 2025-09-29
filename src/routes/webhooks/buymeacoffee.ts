import { broadcastToChat } from '@lib';
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
    async ({ body: data, server, status, headers: { 'x-signature-sha256': signature } }) => {
      if (!hmac.verify(signature, data)) return status(401);

      const event = JSON.parse(data) as BMCWebhookEvent;
      if (!event.live_mode) {
        console.dir(event, { depth: null });
        Bun.write('.webhook.yaml', Bun.YAML.stringify(event, null, 2));
        return status(200);
      }

      switch (event.type) {
        case 'donation.created': {
          broadcastToChat(
            server,
            `Thanks ${event.data.supporter_name} for donating ${event.data.currency} ${event.data.amount} to the project!`
          );
          return status(200);
        }
        case 'recurring_donation.started': {
          broadcastToChat(
            server,
            `Congrats ${event.data.supporter_name} pledging to donate ${event.data.currency} ${event.data.amount} to the project every month!`
          );
          return status(200);
        }
        case 'recurring_donation.updated': {
          broadcastToChat(
            server,
            `Congrats ${event.data.supporter_name} pledging to donate ${event.data.currency} ${event.data.amount} to the project every month!`
          );
          return status(200);
        }
        case 'recurring_donation.cancelled': {
          broadcastToChat(
            server,
            `Thanks ${event.data.supporter_name} for your support! Sad to see you go.`
          );
          return status(200);
        }
        case 'membership.started': {
          broadcastToChat(
            server,
            `Congrats ${event.data.supporter_name} for becoming a ${event.data.membership_level_name}!`
          );
          return status(200);
        }
        case 'membership.updated': {
          broadcastToChat(
            server,
            `${event.data.supporter_name} just evolved to ${event.data.membership_level_name}! Cheers!`
          );
          return status(200);
        }
        case 'membership.cancelled': {
          broadcastToChat(
            server,
            `Thanks ${event.data.supporter_name} for your support! Sad to see you go.`
          );
          return status(200);
        }
        default: {
          return status(400);
        }
      }
    },
    {
      parse: 'text',
      body: type.string,
      headers: type({ 'x-signature-sha256': 'string' }),
    }
  );
};
