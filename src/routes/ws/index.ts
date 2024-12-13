import { MAX_FILE_SIZE } from '@constants';
import { Elysia, t } from 'elysia';
import { db } from '@services/mongodb';
import cache from '@services/cache';

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

const WS_GAME_NOT_FOUND = {
  type: 'Error',
  data: {
    message: 'Game not found',
  },
} as const;

async function getGameDataWithCache(gameId: string): Promise<string | null> {
  const cachedData = await cache.get(gameId);
  if (cachedData) return cachedData;

  const game = await db.UncivServer.findOne({ _id: gameId }, { projection: { _id: 0, text: 1 } });
  if (!game) return null;

  await cache.set(gameId, game.text);
  return game.text;
}

export const websocketsRoute = new Elysia({
  websocket: {
    idleTimeout: 30,
    maxPayloadLength: MAX_FILE_SIZE,
  },
}).ws('/ws', {
  body: t.Object({ type: t.String(), data: t.Optional(t.Object(t.Unknown())) }),
  response: t.Object({ type: t.String(), data: t.Optional(t.Object(t.Unknown())) }),
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
        const gameId: string = data['gameId'];
        // send game data here
        // type is { type: 'GameData', data: { gameId: string, content: string } }
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
