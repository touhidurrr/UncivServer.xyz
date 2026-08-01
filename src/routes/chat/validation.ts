import { MAX_CHAT_MESSAGE_LENGTH, SANITIZED_TEXT_SCHEMA, UUID_SCHEMA } from '@constants';
import { type } from 'arktype';

export const WS_MESSAGE_CHAT_SCHEMA = type({
  type: "'chat'",
  civName: type('0 < string <= 128'),
  message: SANITIZED_TEXT_SCHEMA.to(`0 < string <= ${MAX_CHAT_MESSAGE_LENGTH}`),
  gameId: UUID_SCHEMA,
  'userId?': UUID_SCHEMA,
});

export const WS_MESSAGE_JOIN_SCHEMA = type({
  type: "'join'",
  gameIds: UUID_SCHEMA.array(),
});

export const WS_MESSAGE_LEAVE_SCHEMA = type({
  type: "'leave'",
  gameIds: UUID_SCHEMA.array(),
});

export const WS_CHAT_MESSAGE_SCHEMA = type.or(
  WS_MESSAGE_CHAT_SCHEMA,
  WS_MESSAGE_JOIN_SCHEMA,
  WS_MESSAGE_LEAVE_SCHEMA
);
