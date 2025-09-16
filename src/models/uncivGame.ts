import * as notificationsData from '@data/notifications';
import type { Civilization, Notification, UncivJSON } from '@localTypes/unciv';
import { unpack } from '@services/uncivJSON';
import { type } from 'arktype';
import { choice, probability } from 'randomcryp';

const DEFAULT_NOTIFICATION = 'Welcome to UncivServer.xyz!';
const DEFAULT_NOTIFICATION_ICON = 'NotificationIcons/RobotArm';
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const DEFAULT_SPN_ICON = notificationsData.icons.promotion[0]!;

// Self promotion notification probability
const SPN_PROBABILITY = 0.2;

const UncivGameSchema = type({
  '+': 'ignore',
  gameId: "string.uuid",
  currentPlayer: 'string',
  civilizations: type({
    '+': 'ignore',
    civName: 'string',
    'playerType?': "'Human' | 'AI'",
    'playerId?': "string.uuid",
  }).array(),
  gameParameters: {
    '+': 'ignore',
    players: type({
      '+': 'ignore',
      'chosenCiv?': 'string',
      'playerType?': "'Human' | 'AI'",
      'playerId?': "string.uuid",
    }).array(),
  },
  'turns?': 'number.integer',
  'difficulty?': 'string',
  'currentTurnStartTime?': 'number.integer',
  'version?': {
    number: 'number',
    createdWith: {
      text: 'string',
      number: 'number',
    },
  },
});

export class UncivGame {
  data: UncivJSON;
  gameId: string;
  previewId: string;
  currentPlayer: string;
  currentCiv: Civilization | undefined;
  players: string[];

  constructor(json: string) {
    const parsedGame = UncivGameSchema(unpack(json));

    if (parsedGame instanceof type.errors) {
      throw new Error('Invalid Game Data!');
    }

    this.data = parsedGame as UncivJSON;
    this.gameId = this.data.gameId;
    this.previewId = `${this.data.gameId}_Preview`;
    this.currentPlayer = this.data.currentPlayer;
    this.currentCiv = this.data.civilizations.find(civ => civ.civName === this.data.currentPlayer);

    this.players = new Set(
      [
        ...this.data.civilizations.map(c => c.playerId),
        ...this.data.gameParameters.players.map(p => p.playerId),
      ].filter(id => typeof id === 'string')
    )
      .values()
      .toArray();
  }

  getTurns = () => this.data.turns ?? 0;

  isVersionAtLeast({ number, createdWithNumber }: { number?: number; createdWithNumber?: number }) {
    if (!this.data.version) return true;
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
    thisArg?: unknown
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
    if (!this.data.version) throw new Error('Unknown Game Version');

    let text = DEFAULT_NOTIFICATION;
    const icons = [DEFAULT_NOTIFICATION_ICON];
    const actions: Notification['actions'] = [];

    if (this.data.turns) {
      // Self promotion notifications
      if (probability(SPN_PROBABILITY)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { message, url, icon } = choice(notificationsData.promotions)!;
        text = message;
        icons[0] = icon || DEFAULT_SPN_ICON;
        if (this.data.version.createdWith.number > 1076) {
          actions[0] = { LinkAction: { url } };
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        text = choice(notificationsData.messages)!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    if (this.currentCiv && this.data.version) {
      const newNotification = this.generateRandomNotification();
      if (this.currentCiv.notifications) this.currentCiv.notifications.push(newNotification);
      else this.currentCiv.notifications = [newNotification];
    }
  }
}
