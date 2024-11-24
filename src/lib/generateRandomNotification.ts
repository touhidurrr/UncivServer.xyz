import { SUPPORT_MESSAGE } from '@constants';
import type { Notification, UncivJSON } from '@localTypes/unciv';
import random from 'random';

const defaultNotification = 'Welcome to UncivServer.xyz!';
const defaultNotificationIcon = 'NotificationIcons/RobotArm';

const notificationIcons = [defaultNotificationIcon, 'NotificationIcons/ServerRack'];

const randomNotifications = [
  `${defaultNotification} Again!`,
  "It's your turn!",
  'Time to make some moves!',
  'Hi! Server here. Have a nice day!',
  "Don't forget to press 'Next Turn' when you're done!",
  "Hi, there! @touhidurrr here from UncivServer.xyz. Don't forget I might be watching your every move...",
  "Let's speed through some turns!",
];

const supportNotificationIcons = ['NotificationIcons/DollarSign'];

const randomSupportNotifications = [SUPPORT_MESSAGE];

const supportNotificationsProbability = 0.2;

export function generateRandomNotification(gameData: UncivJSON): Notification {
  let text = defaultNotification;
  let icons = [defaultNotificationIcon];

  if (gameData.turns) {
    if (random.float() < supportNotificationsProbability) {
      text = random.choice(randomSupportNotifications)!;
      icons[0] = random.choice(supportNotificationIcons)!;
    } else {
      text = random.choice(randomNotifications)!;
      icons[0] = random.choice(notificationIcons)!;
    }
  }

  return {
    text,
    icons,
    category: 'General',
    actions: [],
  };
}
