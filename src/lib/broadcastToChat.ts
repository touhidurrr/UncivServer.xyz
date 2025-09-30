import type { WSChatResponseRelay } from '@localTypes/chat';

// 5 minutes
const MIN_BROADCAST_INTERVAL = 5 * 1000 * 60;

export let queuedBroadcastMessages = 0;
let lastBroadcast = 0;
let nextAvailableSlot = 0;

export const broadcastToChat = (server: Bun.Server | null, message: string) => {
  const now = Date.now();
  const earliestSendTime = Math.max(lastBroadcast + MIN_BROADCAST_INTERVAL, now);
  const delay = Math.max(0, nextAvailableSlot - now);

  queuedBroadcastMessages++;
  nextAvailableSlot = Math.max(nextAvailableSlot, earliestSendTime) + MIN_BROADCAST_INTERVAL;
  setTimeout(() => {
    queuedBroadcastMessages--;
    lastBroadcast = Date.now();
    server?.publish(
      'chat',
      JSON.stringify({
        type: 'chat',
        gameId: '',
        civName: 'Server',
        message,
      } as WSChatResponseRelay)
    );
  }, delay);
};
