import { MAX_FILE_SIZE } from '@constants';
import { Elysia, t } from 'elysia';

const WS_UNKNOWN_MESSAGE = {
  type: 'Error',
  data: {
    message: 'Unknown message type',
  },
} as const;

const WS_INVALID_MESSAGE = {
  type: 'Error',
  data: {
    message: 'Invalid message',
  },
} as const;

export const websocketsRoute = new Elysia({
  websocket: {
    idleTimeout: 30,
    maxPayloadLength: MAX_FILE_SIZE,
  },
}).ws('/ws', {
  body: t.Object({ type: t.String(), data: t.Optional(t.Object(t.Unknown())) }),
  open: ws => {
    try {
      // Decode userId from authorization header
      const authorization = ws.data.headers['authorization']!;
      const [userId] = Buffer.from(authorization.split(' ')[1], 'base64')
        .toString('utf-8')
        .split(':');

      // subscribe socket to its channel
      ws.subscribe(`user:${userId}`);
    } catch (error) {
      console.log(`[WS] Error subscribing socket to its channel:`, error);
      ws.send({
        type: 'Error',
        data: {
          message: 'Invalid connection attempt',
        },
      }).close();
    }
  },
  // @ts-ignore
  message: async (ws, { type, data }) => {
    switch (type) {
      case 'Ping':
        ws.send({ type: 'Pong' });
        break;
      case 'GameInfo':
        if (!data || !data['gameId']) {
          ws.send(WS_INVALID_MESSAGE);
          break;
        }
        //@ts-ignore
        const gameId: string = data['gameId'];
        // send game data here
        // type is { type: 'GameData', data: { gameId: string, content: string } }
        break;
      default:
        ws.send(WS_UNKNOWN_MESSAGE);
    }
  },
});
