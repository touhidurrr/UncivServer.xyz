import * as notificationsData from '@data/notifications';
import type { Notification, UncivJSON } from '@localTypes/unciv';
import random from 'random';

const DEFAULT_NOTIFICATION = 'Welcome to UncivServer.xyz!';
const DEFAULT_NOTIFICATION_ICON = 'NotificationIcons/RobotArm';
const DEFAULT_SPN_ICON = notificationsData.icons.promotion[0]!;

// Self promotion notification probability
const SPN_PROBABILITY = 0.2;

export const generateRandomNotification = (gameData: UncivJSON): Notification => {
  let text = DEFAULT_NOTIFICATION;
  const icons = [DEFAULT_NOTIFICATION_ICON];
  const actions: Notification['actions'] = [];

  if (gameData.turns) {
    // Self promotion notifications
    if (random.float() < SPN_PROBABILITY) {
      const { message, url, icon } = random.choice(notificationsData.promotion)!;
      text = message;
      icons[0] = icon || DEFAULT_SPN_ICON;
      if (gameData.version.createdWith.number > 1076) {
        actions[0] = { LinkAction: { url } };
      }
    } else {
      text = random.choice(notificationsData.classic)!;
      icons[0] = random.choice(notificationsData.icons.classic)!;
    }
  }

  return {
    text,
    icons,
    actions,
    category: 'General',
  };
};
