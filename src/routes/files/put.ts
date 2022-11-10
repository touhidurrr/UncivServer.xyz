import { writeFile } from 'fs';
import Discord from '../../modules/Discord';
import UncivParser from '../../modules/UncivParser';
import { type FastifyRequest } from 'fastify/types/request';
import { type RouteHandlerMethod } from 'fastify/types/route';

const errorLogger = e => console.error(e?.stack);
const ServerList = process.env.Servers.split(/[\n\s]+/);

const putFile: RouteHandlerMethod = async (
  req: FastifyRequest & { params: { id: string } },
  reply
) => {
  const { fileName, params, server, url, body } = req;
  const gameFileName = params.id;

  if (!server.gameFileRegex.test(gameFileName)) {
    reply.status(400);
    return 'Invalid game ID!';
  }

  if (!body) {
    reply.status(400);
    return 'Empty request body at PUT!';
  }

  writeFile(fileName, body as string, errorLogger);
  server.UncivDropbox.upload(gameFileName, body).catch(errorLogger);
  ServerList.forEach(api => {
    fetch(`${api}/files/${gameFileName}`, { method: 'PATCH', body }).catch(errorLogger);
  });
  await server.redis.set(url, body as string).catch(errorLogger);
  await server.db.UncivServer.updateOne(
    { _id: gameFileName },
    { $set: { timestamp: Date.now(), text: body } },
    { upsert: true }
  );

  // If fileName is game Preview type
  if (gameFileName.endsWith('_Preview')) {
    trySendNotification(req, gameFileName).catch(errorLogger);
  }

  return '200 OK!';
};

export default putFile;

async function trySendNotification(req: FastifyRequest, gameFileName: string) {
  const { server, body } = req;
  const gameID = gameFileName.slice(0, -8);

  const { civilizations, currentPlayer, turns, gameParameters } = UncivParser.parse(body as string);

  // Log & exit if invalid data
  console.dir({ turns, currentPlayer, civilizations, gameID }, { depth: null });
  if (!currentPlayer || !civilizations) return;

  // find currentPlayer's ID
  const { playerId } = civilizations.find(c => c.civName === currentPlayer);
  if (!playerId) return;
  // Check if the Player exists in DB
  const queryResponse = await server.db.PlayerProfiles.findOne(
    { uncivUserIds: playerId },
    { projection: { notifications: 1, dmChannel: 1 } }
  ).catch(errorLogger);

  if (queryResponse) {
    if (!queryResponse.dmChannel) {
      try {
        const dmChannel = await Discord.getDMChannel(queryResponse._id.toString());
        await server.db.PlayerProfiles.updateOne(
          { _id: queryResponse._id },
          { $set: { dmChannel } }
        );
        queryResponse.dmChannel = dmChannel;
      } catch (err) {
        errorLogger(err);
      }
    }
  } else return;

  // Unique list of Players
  const players = [
    ...new Set(
      gameParameters.players
        .concat(civilizations)
        .map(c => c.playerId)
        .filter(id => id)
    ),
  ];

  const { name } = (
    await server.db.UncivServer.findOneAndUpdate(
      { _id: gameFileName },
      { $set: { currentPlayer, playerId, turns: turns || 0, players } },
      { projection: { _id: 0, name: 1 } }
    )
  ).value;

  if (!queryResponse.dmChannel || queryResponse.notifications !== 'enabled') return;
  await Discord.createMessage(queryResponse.dmChannel, {
    embeds: [
      {
        color: Math.floor(0x1000000 * Math.random()),
        author: {
          name: 'UncivServer.xyz Turn Notification',
          icon_url: 'https://i.imgur.com/nf2lNl0.png',
        },
        fields: [
          {
            name: !name ? 'game ID' : 'Name',
            value: `\`\`\`${name || gameID}\`\`\``,
            inline: false,
          },
          {
            name: 'Your Civ',
            value: `\`\`\`${currentPlayer}\`\`\``,
            inline: true,
          },
          {
            name: 'Current Turn',
            value: `\`\`\`${turns || 0}\`\`\``,
            inline: true,
          },
          {
            name: 'Players',
            value: `\`\`\`${civilizations
              .filter(c => c.playerType === 'Human')
              .map(c => c.civName)
              .join(', ')}\`\`\``,
            inline: false,
          },
        ],
      },
    ],
  }).catch(errorLogger);
}
