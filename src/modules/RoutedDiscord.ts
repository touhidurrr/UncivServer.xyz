const { ReRouteEndpoint } = process.env;
const apiEndpoint = 'https://discord.com/api/v10';

async function createMessage(channelId: string, message: object) {
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
      body: await res.text(),
    });
  });
}

async function getDMChannel(discordId) {
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
    .then((ch: any) => ch.id);
}

export default {
  createMessage,
  getDMChannel,
};
