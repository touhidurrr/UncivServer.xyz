import * as notificationsData from '@data/notifications';
import type { Notification, UncivJSON } from '@localTypes/unciv';
import random from 'random';

const DEFAULT_NOTIFICATION = 'Welcome to UncivServer.xyz!';
const DEFAULT_NOTIFICATION_ICON = 'NotificationIcons/RobotArm';

const SUPPORT_NOTIFICATION_PROBABILITY = 0.2;

export function generateRandomNotification(gameData: UncivJSON): Notification {
  let text = DEFAULT_NOTIFICATION;
  const icons = [DEFAULT_NOTIFICATION_ICON];
  const actions: Notification['actions'] = [];

  if (gameData.turns) {
    if (random.float() < SUPPORT_NOTIFICATION_PROBABILITY) {
      text = random.choice(notificationsData.support)!;
      icons[0] = random.choice(notificationsData.icons.support)!;
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
}
