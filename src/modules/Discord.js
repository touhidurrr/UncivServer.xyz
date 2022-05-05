const apiEndpoint = 'https://discord.com/api/v10';

exports.createMessage = async (channelId, message) => {
  return await fetch(`${apiEndpoint}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify(message),
  });
};

exports.getDMChannel = async discordId => {
  return await fetch(`${apiEndpoint}/users/@me/channels`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify({ recipient_id: discordId }),
  })
    .then(res => res.json())
    .then(ch => ch.id);
};

module.exports = exports;
