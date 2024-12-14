import { GAME_ID_REGEX, MAX_FILE_SIZE } from '@constants';
import { t } from 'elysia';

export const WS_MAX_PAYLOAD_LENGTH = MAX_FILE_SIZE + 100;

export const WS_UNKNOWN_MESSAGE = {
  type: 'Error',
  data: {
    message: 'Unknown message type',
  },
} as const;

export const WS_INVALID_MESSAGE = {
  type: 'Error',
  data: {
    message: 'Invalid message',
  },
} as const;

export const WS_GAME_NOT_FOUND = {
  type: 'Error',
  data: {
    message: 'Game not found',
  },
} as const;

export const WS_RESPONSE_ERROR_SCHEMA = t.Object({
  type: t.Literal('Error'),
  data: t.Object({ message: t.String() }),
});

export const WS_BODY_PING_SCHEMA = t.Object({ type: t.Literal('Ping') });

export const WS_RESPONSE_PONG_SCHEMA = t.Object({ type: t.Literal('Pong') });

export const WS_BODY_GAME_INFO_SCHEMA = t.Object({
  type: t.Literal('GameInfo'),
  data: t.Object({ gameId: t.RegExp(GAME_ID_REGEX) }),
});

export const WS_RESPONSE_GAME_DATA_SCHEMA = t.Object({
  type: t.Literal('GameData'),
  data: t.Object({ gameId: t.RegExp(GAME_ID_REGEX), content: t.String() }),
});

export const WS_BODY_SCHEMA = t.Union([WS_BODY_PING_SCHEMA, WS_BODY_GAME_INFO_SCHEMA]);

export const WS_RESPONSE_SCHEMA = t.Union([
  WS_RESPONSE_ERROR_SCHEMA,
  WS_RESPONSE_PONG_SCHEMA,
  WS_RESPONSE_GAME_DATA_SCHEMA,
]);
