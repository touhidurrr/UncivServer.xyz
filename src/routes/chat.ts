import { GAME_ID_REGEX, NO_CACHE_CONTROL } from '@constants';
import { parseBasicHeader } from '@lib/parseBasicHeader';
import db from '@services/mongodb';
import { unpack } from '@services/uncivGame';
import { Elysia, t } from 'elysia';
import type { ElysiaWS } from 'elysia/ws';

function publishChat(ws: ElysiaWS, chat: WSChatRelay) {
  const civNames = (
    ws as any as { data: { gameId2CivNames: Map<string, string[]> } }
  ).data.gameId2CivNames.get(chat.gameId);
  if (!civNames || !civNames.includes(chat.civName)) return;

  chat.message = chat.message.replaceAll(/\s+/g, ' ').trim();
  ws.publish(chat.gameId, JSON.stringify(chat));
}

export const chatPlugin = (app: Elysia) =>
  app.guard(
    {
      headers: t.Object({ authorization: t.String({ minLength: 56, maxLength: 512 }) }),
    },
    app =>
      app
        .derive(async ({ set, headers, status }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;

          const [userId, password] = parseBasicHeader(headers.authorization);
          if (!GAME_ID_REGEX.test(userId)) return status('Bad Request');

          // password is required for chatting
          if (!password) return status('Unauthorized');

          const dbAuth = await db.Auth.findById(userId, { hash: 1 });
          if (!dbAuth) return status('Unauthorized');
          if (dbAuth) {
            const verified = await Bun.password.verify(password, dbAuth.hash);
            if (!verified) return status('Unauthorized');
          }

          return {
            userId,
            gameId2CivNames: new Map<string, string[]>(),
          };
        })
        .ws('/chat', {
          message: async (ws, message: WSChatMessage) => {
            if (typeof message !== 'object' || !message.type) {
              const error: WSChatResponseError = {
                type: 'error',
                message: 'Expecting valid JSON data with a "type" field',
              };

              return ws.send(error);
            }

            switch (message.type) {
              case 'chat':
                if (ws.isSubscribed(message.gameId)) {
                  if (message.message.length > 1024) {
                    const error: WSChatResponseError = {
                      type: 'error',
                      message: 'Message too long. Maximum allowed characters: 1024.',
                    };
                    return ws.send(error);
                  }
                  publishChat(ws as any, message);
                }
                break;
              case 'join':
                const { userId, gameId2CivNames } = ws.data;
                const games = await db.UncivGame.find(
                  { players: userId, _id: { $in: message.gameIds.map(id => `${id}_Preview`) } },
                  { text: 1 }
                ).then(games => games.map(g => unpack(g.text)));

                const acceptedGameIds: string[] = [];
                games.forEach(game => {
                  ws.subscribe(game.gameId);
                  acceptedGameIds.push(game.gameId);
                  game.civilizations.forEach(civ => {
                    if (civ.playerId === userId) {
                      const civNames = gameId2CivNames.get(game.gameId) || [];
                      civNames.push(civ.civName);
                      gameId2CivNames.set(game.gameId, civNames);
                    }
                  });
                });

                ws.send({
                  type: 'joinSuccess',
                  gameIds: acceptedGameIds,
                } satisfies WSChatResponseJoinSuccess);
                break;
              case 'leave':
                message.gameIds.forEach(gameId => {
                  ws.unsubscribe(gameId);
                  ws.data.gameId2CivNames.delete(gameId);
                });
                break;
              default:
                const error: WSChatResponseError = {
                  type: 'error',
                  message: `Unknown message type: ${(message as { type: any }).type}`,
                };
                ws.send(error);
            }
          },
        })
  );
