const { ReRouteEndpoint } = process.env;
const apiEndpoint = 'https://discord.com/api/v10';

import {
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';

async function createMessage(channelId: string, message: RESTPostAPIChannelMessageJSONBody) {
  return fetch(ReRouteEndpoint, {
    method: 'POST',
    headers: {
      To: `${apiEndpoint}/channels/${channelId}/messages`,
      'Api-Key': process.env.ReRoute,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify(message),
  }).then(async res => {
    console.log('ReRouted Discord:', {
      status: res.status,
      statusText: res.statusText,
      body: (await res.json()) as RESTPostAPIChannelMessageResult,
    });
  });
}

async function getDMChannel(discordId: string) {
  return fetch(ReRouteEndpoint, {
    method: 'POST',
    headers: {
      To: `${apiEndpoint}/users/@me/channels`,
      'Api-Key': process.env.ReRoute,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify({ recipient_id: discordId }),
  })
    .then(res => res.json())
    .then((ch: RESTPostAPICurrentUserCreateDMChannelResult) => ch.id);
}

export default {
  createMessage,
  getDMChannel,
};
