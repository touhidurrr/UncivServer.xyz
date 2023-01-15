import type {
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';

const apiEndpoint = 'https://discord.com/api/v10';
const { ReRoute, ReRouteEndpoint, DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN');
if (!ReRouteEndpoint) throw new Error('Missing ReRouteEndpoint');
if (!ReRoute) throw new Error('Missing ReRoute Token');

function createMessage(channelId: string, message: RESTPostAPIChannelMessageJSONBody) {
  return fetch(ReRouteEndpoint!, {
    method: 'POST',
    headers: {
      To: `${apiEndpoint}/channels/${channelId}/messages`,
      'Api-Key': ReRoute!,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_TOKEN}`,
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

function getDMChannel(discordId: string) {
  return fetch(ReRouteEndpoint!, {
    method: 'POST',
    headers: {
      To: `${apiEndpoint}/users/@me/channels`,
      'Api-Key': ReRoute!,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_TOKEN}`,
    },
    body: JSON.stringify({ recipient_id: discordId }),
  })
    .then(res => res.json() as Promise<RESTPostAPICurrentUserCreateDMChannelResult>)
    .then(ch => ch.id);
}

export default {
  createMessage,
  getDMChannel,
};
