import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import { writeFile } from 'fs';
import Discord from '../../modules/Discord';
import ReRoutedDiscord from '../../modules/ReRoutedDiscord';
import { validateBody } from '../../modules/Validation';
import { getPlayers } from '../../plugins/Auth';
import { errorLogger } from '../../plugins/Constants';
import type { FileRouteType } from '../../server';

const { PATCH_KEY } = process.env;
const discord = process.env.RouteDiscord ? ReRoutedDiscord : Discord;

type PutFileRequest = FastifyRequest<FileRouteType>;

const putFile = async (req: PutFileRequest, reply: FastifyReply) => {
  const { params, server, url, body } = req;
  const gameFileName = params.id;

  if (!validateBody(body)) {
    reply.status(400);
    tryLogSenderInfo(req);
    return 'Bad Request!';
  }

  // update cache
  await server.cache.files.set(url, body);
  // try updating other file locations asynchronously for better performance
  tryUpdatingGameDataSilently(req, gameFileName);

  // If fileName is game Preview type
  if (gameFileName.endsWith('_Preview')) {
    trySendNotification(req, gameFileName).catch(errorLogger);
  }

  return '200 OK!';
};

export default putFile;

async function tryLogSenderInfo(req: PutFileRequest) {
  const { server, ip, hostname, protocol, url, fileName, headers } = req;
  await server.db.ErrorLogs.insertOne({
    type: 'InvalidPutBody',
    timestamp: Date.now(),
    data: {
      ip,
      url,
      protocol,
      hostname,
      fileName,
      headers,
    },
  }).catch(errorLogger);
}

const ServerList = process.env.Servers!.split(/[\n\s]+/);
function sendGameToOtherServers(gameFileName: string, body: string) {
  ServerList.length &&
    ServerList.forEach(api => {
      fetch(`${api}/files/${gameFileName}`, {
        method: 'PATCH',
        body,
        headers: {
          'uncivserver-patch-key': PATCH_KEY!,
        },
      }).catch(errorLogger);
    });
}

async function tryUpdatingGameDataSilently(req: PutFileRequest, gameFileName: string) {
  const { fileName, body, server } = req;
  writeFile(fileName, body, errorLogger);
  sendGameToOtherServers(gameFileName, body);
  await server.db.UncivServer.updateOne(
    { _id: gameFileName },
    { $set: { timestamp: Date.now(), text: body } },
    { upsert: true }
  )
    .then(() => console.log(`${gameFileName} updated on MongoDB successfully`))
    .catch(err => {
      console.log(`Err updating ${gameFileName} on MongoDB`);
      server.errorLogger(err);
    });
}

async function trySendNotification(req: PutFileRequest, gameFileName: string) {
  const { server, game, playerId } = req;
  const gameID = gameFileName.slice(0, -8);

  const { civilizations, currentPlayer, turns, gameParameters } = game!;

  // Log & exit if invalid data
  console.dir({ turns, currentPlayer, civilizations, gameID }, { depth: null });

  // Check if the Player exists in DB
  const queryResponse = await server.db.PlayerProfiles.findOne(
    { uncivUserIds: playerId },
    { projection: { notifications: 1, dmChannel: 1 } }
  ).catch(errorLogger);

  if (queryResponse) {
    if (!queryResponse.dmChannel) {
      try {
        const dmChannel = await discord.getDMChannel(queryResponse._id.toString());
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
  const players = getPlayers(game!);

  const name: string | undefined = await server.db.UncivServer.findOneAndUpdate(
    { _id: gameFileName },
    { $set: { currentPlayer, playerId, turns: turns || 0, players } },
    { projection: { _id: 0, name: 1 } }
  ).then(game => game?.name);

  if (!queryResponse.dmChannel || queryResponse.notifications !== 'enabled') return;
  await discord
    .createMessage(queryResponse.dmChannel, {
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
              value: `\`\`\`${name ?? gameID}\`\`\``,
              inline: false,
            },
            {
              name: 'Your Civ',
              value: `\`\`\`${currentPlayer}\`\`\``,
              inline: true,
            },
            {
              name: 'Current Turn',
              value: `\`\`\`${turns ?? 0}\`\`\``,
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
    })
    .catch(errorLogger);
}
