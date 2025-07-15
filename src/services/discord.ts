import { SUPPORT_EMBED } from '@constants';
import { REST } from '@discordjs/rest';
import { getRandomColor } from '@lib/getRandomColor';
import {
  Routes,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';
import type { UncivGame } from '../models/uncivGame';
import { db } from './mongodb';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

export const isDiscordTokenValid = Boolean(DISCORD_TOKEN);

const discord = new REST({ version: '10' }).setToken(DISCORD_TOKEN ?? '');

// handle some events for debug
discord.on('invalidRequestWarning', data => {
  console.warn(`[Discord] Invalid Request Warning:`, data);
});

discord.on('rateLimited', data => {
  console.warn(`[Discord] Rate Limited:`, data);
});

discord.on('response', ({ path, method }, { status, statusText }) => {
  console.log(`[Discord]`, method, path, status, statusText);
});

const createMessage = (
  channelId: string,
  message: RESTPostAPIChannelMessageJSONBody
): Promise<RESTPostAPIChannelMessageResult> => {
  return discord.post(Routes.channelMessages(channelId), {
    body: message,
  }) as Promise<RESTPostAPIChannelMessageResult>;
};

const getDMChannel = async (discordId: string) => {
  const res = (await discord.post(Routes.userChannels(), {
    body: { recipient_id: discordId },
  })) as RESTPostAPICurrentUserCreateDMChannelResult;
  return res.id;
};

export const sendNewTurnNotification = async (game: UncivGame) => {
  const { turns, gameId, civilizations, currentPlayer } = game.data;

  // find currentPlayer's ID
  const currentCiv = civilizations.find(c => c.civName === currentPlayer);
  if (!currentCiv) {
    console.error('[TurnNotifier] currentPlayer not found for gameId:', gameId);
    return;
  }

  // Check if the Player exists in DB
  const { playerId } = currentCiv;
  const playerProfile = await db.PlayerProfile.findOne(
    { uncivUserIds: playerId },
    { notifications: 1, dmChannel: 1 }
  );

  // if player has not registered or has disabled notifications, return
  if (!playerProfile || playerProfile.notifications !== 'enabled') return;

  // If the player doesn't have a DM channel, create one
  if (!playerProfile.dmChannel) {
    try {
      playerProfile.dmChannel = await getDMChannel(playerProfile._id.toString());
      await playerProfile.save();
    } catch (err) {
      console.error('[TurnNotifier] error creating DM channel for:', playerProfile);
      console.error(err);
      return;
    }
  }

  // Unique list of Players
  const players = game.getPlayers();

  // update game info on DB and return game name
  const name = await db.UncivGame.findByIdAndUpdate(
    //? always save metadata to preview file
    `${gameId}_Preview`,
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
          ...(name
            ? [
                {
                  name: 'Game Name',
                  value: `\`\`\`${name}\`\`\``,
                  inline: true,
                },
              ]
            : []),
          {
            name: 'Game ID',
            value: `\`\`\`${gameId}\`\`\``,
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
      SUPPORT_EMBED,
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
};
