import { app } from '@index';
import { Elysia, t } from 'elysia';
import {
  WS_BODY_SCHEMA,
  WS_GAME_NOT_FOUND,
  WS_MAX_PAYLOAD_LENGTH,
  WS_RESPONSE_SCHEMA,
  WS_UNKNOWN_MESSAGE,
} from './constants';

const FILES_BASE_URL = `http://[::1]:1557/files`;

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
        // internally fetch game data and send it to the client
        // no outgoing traffic to other services
        const getResponse = await app.handle(new Request(`${FILES_BASE_URL}/${data.gameId}`));
        if (!getResponse.ok) {
          ws.send(WS_GAME_NOT_FOUND);
          break;
        }
        ws.send({
          type: 'GameData',
          data: {
            gameId: data.gameId,
            content: await getResponse.text(),
          },
        });
        break;
      case 'GameUpdate':
        const putResponse = await app.handle(
          new Request(`${FILES_BASE_URL}/${data.gameId}`, {
            method: 'PUT',
            body: data.content,
            headers: {
              'content-length': data.content.length.toString(),
            },
          })
        );
        if (!putResponse.ok) {
          ws.send({
            type: 'Error',
            data: {
              message: 'Error updating game data',
            },
          });
          break;
        }
        break;
      default:
        ws.send(WS_UNKNOWN_MESSAGE);
    }
  },
});
