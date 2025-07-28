import type { ElysiaWS } from 'elysia/ws';

export type WSChatMessageRelay = {
  type: 'chat';
  civName: string;
  message: string;
  gameId: string;
};

export type WSChatResponseRelay = WSChatMessageRelay & { gameId?: string };

export type WSChatMessage =
  | WSChatMessageRelay
  | WSChatMessageGameSubscribe
  | WSChatMessageGameUnsubscribe;

export type WSChatMessageGameSubscribe = {
  type: 'join';
  gameIds: string[];
};

export type WSChatMessageGameUnsubscribe = {
  type: 'leave';
  gameIds: string[];
};

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
  run: (info: { ws: ElysiaWS; name: string; input: string; chat: WSChatMessageRelay }) => any;
};
