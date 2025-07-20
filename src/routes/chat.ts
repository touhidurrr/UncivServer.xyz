import { GAME_ID_REGEX, NO_CACHE_CONTROL } from '@constants';
import { parseBasicHeader } from '@lib/parseBasicHeader';
import db from '@services/mongodb';
import { unpack } from '@services/uncivJSON';
import { type Elysia, t } from 'elysia';
import type { ElysiaWS } from 'elysia/ws';

type ChatCommand = {
  description: string;
  run: (info: { ws: ElysiaWS; name: string; input: string; chat: WSChatRelay }) => any;
};

const commands = new Map<string, ChatCommand>();

commands.set('help', {
  description: 'shows this help page',
  run: ({ ws }) =>
    ws.send({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message:
        `\nWelcome to UncivServer.xyz Chat Commands Help Page!` +
        `\nCommands starts with / and are ignored by //` +
        `\n\nAvailable commands (${commands.size}):\n` +
        [...commands.entries()]
          .map(([name, cmd], i) => `${i + 1}. /${name} -> ${cmd.description}`)
          .join('\n'),
    } as WSChatRelay),
});

commands.set('ping', {
  description: 'sends you a pong',
  run: ({ ws, chat: { civName } }) =>
    ws.send({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message: `Hi ${civName}, Pong!`,
    } as WSChatRelay),
});

commands.set('access', {
  description: 'shows who has access to this game',
  run: async ({ ws, chat: { gameId } }) => {
    const players = await db.UncivGame.findById(`${gameId}_Preview`, { _id: 0, players: 1 }).then(
      game => game?.players
    );

    let message = `Game not found! ID: ${gameId}`;
    if (players) {
      message = `\ngameId: ${gameId}, players (${players.length}):\n`;
      message += players.map((p, i) => `${i + 1}. ${p}`).join('\n');
    }

    ws.send({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message,
    } as WSChatRelay);
  },
});

function publishChat(ws: ElysiaWS, chat: WSChatRelay) {
  const civNames = (
    ws as any as { data: { gameId2CivNames: Map<string, string[]> } }
  ).data.gameId2CivNames.get(chat.gameId);
  if (!civNames || !civNames.includes(chat.civName)) {
    chat.message = `Unauthorized Civ: ${chat.civName}`;
    chat.civName = 'Server';
    return ws.send(chat);
  }

  chat.message = chat.message.replaceAll(/\s+/g, ' ').trim();

  // commands scheme
  if (chat.message.startsWith('/')) {
    chat.message = chat.message.slice(1);

    // commands ignore scheme
    if (chat.message.startsWith('/')) {
      return ws.publish(chat.gameId, JSON.stringify(chat));
    }

    // proceed with commands
    let sIdx = chat.message.indexOf(' ');
    if (sIdx < 0) sIdx = chat.message.length;
    const name = chat.message.slice(0, sIdx);

    const command = commands.get(name);
    if (!command) {
      return ws.send({
        type: 'chat',
        gameId: '',
        civName: 'Server',
        message: `Unrecognized command: '/${name}'. Use /help to know more about commands.`,
      } as WSChatRelay);
    }

    const input = chat.message.slice(name.length + 1);
    return command.run({ ws, name, input, chat });
  }

  if (chat.message.length > 0) {
    return ws.publish(chat.gameId, JSON.stringify(chat));
  }
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
              return ws.send({
                type: 'error',
                message: 'Expecting valid JSON data with a "type" field',
              } satisfies WSChatResponseError);
            }

            switch (message.type) {
              case 'chat':
                if (ws.isSubscribed(message.gameId)) {
                  if (message.message.length > 1024) {
                    message.civName = 'Server';
                    message.message = 'Message too long. Maximum allowed characters: 1024.';
                    return ws.send(message);
                  }
                  await publishChat(ws as any, message);
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
                return ws.send({
                  type: 'error',
                  message: `Unknown message type: ${(message as { type: any }).type}`,
                } satisfies WSChatResponseError);
            }
          },
        })
  );
