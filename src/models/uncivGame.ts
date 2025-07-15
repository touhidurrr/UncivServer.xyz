import * as notificationsData from '@data/notifications';
import type { Civilization, Notification, UncivJSON } from '@localTypes/unciv';
import { unpack } from '@services/uncivJSON';
import { choice, probability } from 'randomcryp';

const DEFAULT_NOTIFICATION = 'Welcome to UncivServer.xyz!';
const DEFAULT_NOTIFICATION_ICON = 'NotificationIcons/RobotArm';
const DEFAULT_SPN_ICON = notificationsData.icons.promotion[0]!;

// Self promotion notification probability
const SPN_PROBABILITY = 0.2;

export class UncivGame {
  data: UncivJSON;

  constructor(json: string) {
    this.data = unpack(json);
  }

  getTurns = () => this.data.turns || 0;

  isVersionAtLeast({ number, createdWithNumber }: { number?: number; createdWithNumber?: number }) {
    if (typeof number === 'number' && this.data.version.number < number) return false;
    if (
      typeof createdWithNumber === 'number' &&
      this.data.version.createdWith.number < createdWithNumber
    )
      return false;
    return true;
  }

  getPlayers = () =>
    [
      ...new Set(
        [
          ...this.data.civilizations.map(c => c.playerId),
          ...this.data.gameParameters?.players?.map(p => p.playerId),
        ].filter(Boolean)
      ),
    ] as string[];

  forEachCivilizations = (
    callbackfn: (value: Civilization, index: number, array: Civilization[]) => void,
    thisArg?: any
  ) => this.data.civilizations.forEach(callbackfn, thisArg);

  getCurrentPlayerCivilization = () =>
    this.data.civilizations.find(civ => civ.civName === this.data.currentPlayer);

  getNextPlayerCivilization = (): Civilization | undefined => {
    const humanCivs = this.data.civilizations.filter(civ => civ.playerType === 'Human');
    const curPlayerIndex = humanCivs.findIndex(civ => civ.civName === this.data.currentPlayer);
    const civNameToSearch =
      curPlayerIndex < 0
        ? this.data.currentPlayer
        : humanCivs[(curPlayerIndex + 1) % humanCivs.length].civName;

    return humanCivs.find(civ => civ.civName === civNameToSearch);
  };

  getPreview = () => {
    const {
      turns,
      gameId,
      difficulty,
      civilizations,
      currentPlayer,
      gameParameters,
      currentTurnStartTime,
    } = this.data;

    return {
      turns,
      gameId,
      difficulty,
      currentPlayer,
      gameParameters,
      currentTurnStartTime,
      civilizations: civilizations.map(({ civName, playerId, playerType }) => ({
        civName,
        playerId,
        playerType,
      })),
    };
  };

  generateRandomNotification = (): Notification => {
    let text = DEFAULT_NOTIFICATION;
    const icons = [DEFAULT_NOTIFICATION_ICON];
    const actions: Notification['actions'] = [];

    if (this.data.turns) {
      // Self promotion notifications
      if (probability(SPN_PROBABILITY)) {
        const { message, url, icon } = choice(notificationsData.promotion)!;
        text = message;
        icons[0] = icon || DEFAULT_SPN_ICON;
        if (this.data.version.createdWith.number > 1076) {
          actions[0] = { LinkAction: { url } };
        }
      } else {
        text = choice(notificationsData.classic)!;
        icons[0] = choice(notificationsData.icons.classic)!;
      }
    }

    return {
      text,
      icons,
      actions,
      category: 'General',
    };
  };

  addRandomNotificationToCurrentCiv() {
    const targetCiv = this.getCurrentPlayerCivilization();
    if (targetCiv) {
      const newNotification = this.generateRandomNotification();
      if (targetCiv.notifications) targetCiv.notifications.push(newNotification);
      else targetCiv.notifications = [newNotification];
    }
  }
}
