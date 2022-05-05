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

module.exports = exports;
