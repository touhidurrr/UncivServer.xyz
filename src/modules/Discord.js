const apiEndpoint = 'https://discord.com/api/v10';

exports.createMessage = async (channelId, message) => {
  await fetch(`apiEndpoint/channels/${channelId}/messages`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
    body: JSON.parse(message),
  });
};

module.exports = exports;
