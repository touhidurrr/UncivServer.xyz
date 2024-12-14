import { WS_RESPONSE_SCHEMA } from '@routes/ws/constants';
import type { Static } from 'elysia';

export function getWSMessageString(message: Static<typeof WS_RESPONSE_SCHEMA>): string {
  return JSON.stringify(message);
}
