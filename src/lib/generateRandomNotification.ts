import { SUPPORT_MESSAGE } from '@constants';
import type { Notification, UncivJSON } from '@localTypes/unciv';
import random from 'random';

const defaultNotification = 'Welcome to UncivServer.xyz!';

const randomNotifications: string[] = [
  `${defaultNotification} Again!`,
  "It's your turn!",
  'Time to make some moves!',
  'Hi! Server here. Have a nice day!',
  "Don't forget to skip your turn when you're done!",
  "Hi, there! @touhidurrr here from UncivServer.xyz. Don't forget I might be watching your every move...",
  "Let's speed through some turns!",
];

const randomSupportNotifications: string[] = [SUPPORT_MESSAGE];

const supportNotificationsProbability = 0.2;

export function generateRandomNotification(gameData: UncivJSON): Notification {
  let text = defaultNotification;

  if (gameData.turns) {
    text =
      random.float() < supportNotificationsProbability
        ? random.choice(randomSupportNotifications)!
        : random.choice(randomNotifications)!;
  }

  return {
    text,
    category: 'General',
    icons: ['StatIcons/Happiness'],
    actions: [],
  };
}
