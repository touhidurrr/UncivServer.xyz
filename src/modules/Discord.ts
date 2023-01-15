import { REST } from '@discordjs/rest';
import {
  Routes,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';

if (!process.env.DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN');

const discord = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function createMessage(
  channelId: string,
  message: RESTPostAPIChannelMessageJSONBody
): Promise<RESTPostAPIChannelMessageResult> {
  return discord.post(Routes.channelMessages(channelId), {
    body: message,
  }) as Promise<RESTPostAPIChannelMessageResult>;
}

async function getDMChannel(discordId: string) {
  const res = (await discord.post(Routes.userChannels(), {
    body: { recipient_id: discordId },
  })) as RESTPostAPICurrentUserCreateDMChannelResult;
  return res.id;
}

export default {
  createMessage,
  getDMChannel,
};
