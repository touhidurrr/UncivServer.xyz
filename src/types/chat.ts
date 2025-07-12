// a chat message to be relayed to all clients in a game
type WSChatRelay = {
  type: 'chat';
  civName: string;
  gameId: string;
  message: string;
};

type WSChatMessage = WSChatRelay | WSChatMessageGameSubscribe | WSChatMessageGameUnsubscribe;

type WSChatMessageGameSubscribe = {
  type: 'join';
  gameIds: string[];
};

type WSChatMessageGameUnsubscribe = {
  type: 'leave';
  gameIds: string[];
};

type WSChatResponse = WSChatRelay | WSChatResponseJoinSuccess | WSChatResponseError;

type WSChatResponseJoinSuccess = {
  type: 'joinSuccess';
  gameIds: string[];
};

type WSChatResponseError = {
  type: 'error';
  message: string;
};
