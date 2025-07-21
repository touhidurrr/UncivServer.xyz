import type { ElysiaWS } from 'elysia/ws';

// a chat message to be relayed to all clients in a game
export type WSChatRelay = {
  type: 'chat';
  civName: string;
  gameId: string;
  message: string;
};

export type WSChatMessage = WSChatRelay | WSChatMessageGameSubscribe | WSChatMessageGameUnsubscribe;

export type WSChatMessageGameSubscribe = {
  type: 'join';
  gameIds: string[];
};

export type WSChatMessageGameUnsubscribe = {
  type: 'leave';
  gameIds: string[];
};

export type WSChatResponse = WSChatRelay | WSChatResponseJoinSuccess | WSChatResponseError;

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
  run: (info: { ws: ElysiaWS; name: string; input: string; chat: WSChatRelay }) => any;
};
