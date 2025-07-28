import type { ChatCommand, WSChatResponseRelay } from '@localTypes/chat';
import db from '@services/mongodb';

export default {
  name: 'access',
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

    return ws.send({
      type: 'chat',
      gameId: '',
      civName: 'Server',
      message,
    } as WSChatResponseRelay);
  },
} satisfies ChatCommand;
