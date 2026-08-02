import type {
  WS_CHAT_MESSAGE_SCHEMA,
  WS_MESSAGE_CHAT_SCHEMA,
  WS_MESSAGE_JOIN_SCHEMA,
  WS_MESSAGE_LEAVE_SCHEMA,
} from '@routes/chat/validation';
import type { ElysiaWS } from 'elysia/ws';

export type WSChatMessageRelay = typeof WS_MESSAGE_CHAT_SCHEMA.infer;

export type WSChatResponseRelay = WSChatMessageRelay & { gameId?: string };

export type WSPrivateChatResponseRelay = Omit<WSChatMessageRelay & { private: true }, 'userId'>;

export type WSChatMessage = typeof WS_CHAT_MESSAGE_SCHEMA.infer;

export type WSChatMessageGameSubscribe = typeof WS_MESSAGE_JOIN_SCHEMA.infer;

export type WSChatMessageGameUnsubscribe = typeof WS_MESSAGE_LEAVE_SCHEMA.infer;

export type WSChatResponse = WSChatResponseRelay | WSChatResponseJoinSuccess | WSChatResponseError;

export type WSChatResponseJoinSuccess = {
  type: 'joinSuccess';
  gameIds: string[];
};

export type WSChatResponseError = {
  type: 'error';
  message: string;
};

export type ChatCommand = {
  name: string;
  description: string;
  run: (info: { ws: ElysiaWS; name: string; input: string; chat: WSChatMessageRelay }) => unknown;
};
