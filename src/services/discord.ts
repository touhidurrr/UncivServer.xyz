import { SUPPORT_EMBED } from '@constants';
import { REST } from '@discordjs/rest';
import { getRandomColor } from '@lib';
import type { UncivJSON } from '@localTypes/unciv';
import {
  Routes,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPostAPIChannelMessageResult,
  type RESTPostAPICurrentUserCreateDMChannelResult,
} from 'discord-api-types/rest/v10';
import prisma from './prisma';

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
  console.info(`[Discord]`, method, path, status, statusText);
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

export const sendNewTurnNotification = async (game: UncivJSON) => {
  const { turns, gameId, civilizations, currentPlayer } = game;

  // find currentPlayer's ID
  const currentCiv = civilizations.find(c => c.civName === currentPlayer);
  if (!currentCiv) {
    console.error('[TurnNotifier] currentPlayer not found for gameId:', gameId);
    return;
  }

  // Check if the Player exists in DB
  const { playerId } = currentCiv;
  const playerProfile = await prisma.profile.findFirst({
    where: { users: { some: { userId: playerId } } },
    select: { id: true, notifications: true, discordId: true, dmChannel: true },
  });

  // if player has not registered or has disabled notifications, return
  if (!playerProfile) return;
  const { id, discordId, notifications } = playerProfile;
  if (!discordId || notifications !== 'enabled') return;

  // If the player doesn't have a DM channel, create one
  let { dmChannel } = playerProfile;
  if (!dmChannel) {
    try {
      dmChannel = await getDMChannel(discordId.toString()).then(id => parseInt(id));

      await prisma.profile.update({
        where: { id },
        data: { dmChannel, updatedAt: Date.now() },
      });
    } catch (err) {
      console.error(`[TurnNotifier] error creating DM channel for ${discordId}:`, err);
      return;
    }
  }

  // update game info on DB and return game name
  const name = await prisma.game
    .update({
      where: { id: gameId },
      data: {
        currentPlayer,
        playerId,
        turns: turns || 0,
      },
      select: { name: true },
    })
    .then(game => game?.name);

  await createMessage(dmChannel!.toString(), {
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
    console.error(`[TurnNotifier] ${err} while sending notification:`, {
      gameId,
      playerId,
      currentPlayer,
      dmChannel,
    });
  });
};
