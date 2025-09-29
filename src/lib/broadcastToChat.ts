import type { WSChatResponseRelay } from '@localTypes/chat';

export const broadcastToChat = (server: Bun.Server | null, message: string) =>
  server?.publish(
    'chat',
    JSON.stringify({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message,
    } as WSChatResponseRelay)
  );
