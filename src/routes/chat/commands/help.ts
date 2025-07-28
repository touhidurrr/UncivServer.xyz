import type { ChatCommand, WSChatResponseRelay } from '@localTypes/chat';
import { commands } from '.';

export default {
  name: 'help',
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
        commands
          .values()
          .map(({ name, description }, i) => `${i + 1}. /${name} -> ${description}`)
          .toArray()
          .join('\n'),
    } as WSChatResponseRelay),
} satisfies ChatCommand;
