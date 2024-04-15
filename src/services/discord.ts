import { REST } from '@discordjs/rest';
import { getRandomColor, parseUncivGameData } from '@lib';
import {
  Routes,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';
import { db } from './mongodb';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

export const isDiscordTokenValid = Boolean(DISCORD_TOKEN);

const discord = new REST({ version: '10' }).setToken(DISCORD_TOKEN ?? '');

// bun fix no brotli support
discord.options.headers['Accept-Encoding'] = 'gzip, deflate';

// handle some events for debug
discord.on('invalidRequestWarning', data => {
  console.warn(`[Discord] Invalid Request Warning:`, data);
});

discord.on('rateLimited', data => {
  console.warn(`[Discord] Rate Limited:`, data);
});

discord.on('response', ({ path }, { status, statusText }) => {
  console.log(`[Discord] Response on ${path}: ${status} ${statusText}`);
});

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

export async function sendNewTurnNotification(gameData: string) {
  const game = parseUncivGameData(gameData);
  const { turns, gameId, civilizations, currentPlayer, gameParameters } = game;

  // find currentPlayer's ID
  const currentCiv = civilizations.find(c => c.civName === currentPlayer);
  if (!currentCiv) {
    console.error('[TurnNotifier] currentPlayer not found for gameId:', gameId);
    return;
  }

  // Check if the Player exists in DB
  const { playerId } = currentCiv;
  const playerProfile = await db.PlayerProfiles.findOne(
    { uncivUserIds: playerId },
    { projection: { notifications: 1, dmChannel: 1 } }
  );

  // if player has not registered or has disabled notifications, return
  if (!playerProfile || playerProfile.notifications !== 'enabled') return;

  // If the player doesn't have a DM channel, create one
  if (!playerProfile.dmChannel) {
    try {
      const dmChannel = await getDMChannel(playerProfile._id.toString());
      await db.PlayerProfiles.updateOne({ _id: playerProfile._id }, { $set: { dmChannel } });
      playerProfile.dmChannel = dmChannel;
    } catch (err) {
      console.error('[TurnNotifier] error creating DM channel for:', playerProfile);
      console.error(err);
      return;
    }
  }

  // Unique list of Players
  const players = [
    ...new Set(
      [
        ...civilizations.map(c => c.playerId),
        ...gameParameters.players.map(p => p.playerId),
      ].filter(Boolean)
    ),
  ] as string[];

  // update game info on DB and return game name
  const name = await db.UncivServer.findOneAndUpdate(
    //? always save metadata to preview file
    { _id: `${gameId}_Preview` },
    { $set: { currentPlayer, playerId, turns: turns || 0, players } },
    { projection: { _id: 0, name: 1 } }
  ).then(game => game?.name);

  await createMessage(playerProfile.dmChannel, {
    embeds: [
      {
        color: getRandomColor(),
        author: {
          name: 'UncivServer.xyz Turn Notification',
          icon_url: 'https://i.imgur.com/nf2lNl0.png',
        },
        fields: [
          {
            name: !name ? 'game ID' : 'Name',
            value: `\`\`\`${name ?? gameId}\`\`\``,
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
  }).catch(err => {
    console.error('[TurnNotifier] error sending notification:', {
      gameId,
      playerId,
      currentPlayer,
      dmChannel: playerProfile.dmChannel,
    });
    console.error(err);
  });
}
