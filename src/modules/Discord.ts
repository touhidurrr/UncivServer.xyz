import { REST } from '@discordjs/rest';
import {
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
  Routes,
} from 'discord-api-types/rest/v10';

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
  return discord
    .post(Routes.userChannels(), { body: { recipient_id: discordId } })
    .then((ch: RESTPostAPICurrentUserCreateDMChannelResult) => ch.id);
}

export default {
  createMessage,
  getDMChannel,
};
