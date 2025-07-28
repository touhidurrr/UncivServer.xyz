import type { ChatCommand, WSChatResponseRelay } from '@localTypes/chat';

export default {
  name: 'ping',
  description: 'sends you a pong',
  run: ({ ws, chat: { civName } }) =>
    ws.send({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message: `Hi ${civName}, Pong!`,
    } as WSChatResponseRelay),
} satisfies ChatCommand;
