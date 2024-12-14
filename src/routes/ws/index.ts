import { getGameDataWithCache } from '@lib/getGameDataWithCache';
import { Elysia, t } from 'elysia';
import {
  WS_BODY_SCHEMA,
  WS_GAME_NOT_FOUND,
  WS_MAX_PAYLOAD_LENGTH,
  WS_RESPONSE_SCHEMA,
  WS_UNKNOWN_MESSAGE,
} from './constants';

export const websocketsRoute = new Elysia({
  websocket: {
    idleTimeout: 30,
    maxPayloadLength: WS_MAX_PAYLOAD_LENGTH,
  },
}).ws('/ws', {
  body: WS_BODY_SCHEMA,
  response: WS_RESPONSE_SCHEMA,
  headers: t.Object({ authorization: t.String() }),
  open: ws => {
    try {
      // Decode userId from authorization header
      const [userId] = Buffer.from(ws.data.headers.authorization.split(' ')[1], 'base64')
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
        const { gameId } = data;
        const gameData = await getGameDataWithCache(gameId);
        if (!gameData) {
          ws.send(WS_GAME_NOT_FOUND);
          break;
        }
        ws.send({
          type: 'GameData',
          data: {
            gameId,
            content: gameData,
          },
        });
        break;
      default:
        ws.send(WS_UNKNOWN_MESSAGE);
    }
  },
});
