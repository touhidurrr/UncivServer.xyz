import type { ChatCommand } from '@localTypes/chat';
import access from './access';
import help from './help';
import ping from './ping';

export const commands: Map<string, ChatCommand> = new Map(
  [help, ping, access].map(cmd => [cmd.name, cmd])
);
