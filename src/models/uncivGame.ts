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
  gameId: string;
  previewId: string;
  currentPlayer: string;
  currentCiv: Civilization | undefined;
  players: string[];

  constructor(json: string) {
    this.data = unpack(json);
    this.gameId = this.data.gameId;
    this.previewId = `${this.data.gameId}_Preview`;
    this.currentPlayer = this.data.currentPlayer;
    this.currentCiv = this.data.civilizations.find(civ => civ.civName === this.data.currentPlayer);

    this.players = new Set(
      [
        ...this.data.civilizations.map(c => c.playerId),
        ...this.data.gameParameters?.players?.map(p => p.playerId),
      ].filter(id => typeof id === 'string')
    )
      .values()
      .toArray();

    if (
      [this.data, this.gameId, this.currentPlayer, this.data.civilizations].some(p => !Boolean(p))
    ) {
      throw new Error('Invalid Game Data!');
    }
  }

  getTurns = () => this.data.turns ?? 0;

  isVersionAtLeast({ number, createdWithNumber }: { number?: number; createdWithNumber?: number }) {
    if (typeof number === 'number' && this.data.version.number < number) return false;
    if (
      typeof createdWithNumber === 'number' &&
      this.data.version.createdWith.number < createdWithNumber
    )
      return false;
    return true;
  }

  getHumanCivNames = () =>
    this.data.civilizations
      .filter(civ => civ.playerType === 'Human' || typeof civ.playerId === 'string')
      .map(civ => civ.civName);

  forEachCivilizations = (
    callbackfn: (value: Civilization, index: number, array: Civilization[]) => void,
    thisArg?: any
  ) => this.data.civilizations.forEach(callbackfn, thisArg);

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
        const { message, url, icon } = choice(notificationsData.promotions)!;
        text = message;
        icons[0] = icon || DEFAULT_SPN_ICON;
        if (this.data.version.createdWith.number > 1076) {
          actions[0] = { LinkAction: { url } };
        }
      } else {
        text = choice(notificationsData.messages)!;
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
    if (this.currentCiv) {
      const newNotification = this.generateRandomNotification();
      if (this.currentCiv.notifications) this.currentCiv.notifications.push(newNotification);
      else this.currentCiv.notifications = [newNotification];
    }
  }
}
