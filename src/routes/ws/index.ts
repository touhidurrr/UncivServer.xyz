import { MAX_FILE_SIZE } from '@constants';
import { getGameDataWithCache } from '@lib/getGameDataWithCache';
import { Elysia } from 'elysia';
import {
  WS_BODY_SCHEMA,
  WS_GAME_NOT_FOUND,
  WS_RESPONSE_SCHEMA,
  WS_UNKNOWN_MESSAGE,
} from './constants';

export const websocketsRoute = new Elysia({
  websocket: {
    idleTimeout: 30,
    maxPayloadLength: MAX_FILE_SIZE,
  },
}).ws('/ws', {
  body: WS_BODY_SCHEMA,
  response: WS_RESPONSE_SCHEMA,
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
