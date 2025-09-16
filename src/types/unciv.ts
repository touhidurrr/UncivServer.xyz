export type Position = { x?: number; y?: number };

export type GameDifficulty =
  | 'Settler'
  | 'Chieftain'
  | 'Warlord'
  | 'Prince'
  | 'King'
  | 'Emperor'
  | 'Immortal'
  | 'Deity';

export type VictoryType = 'Scientific' | 'Cultural' | 'Domination' | 'Diplomatic';

export type MapGenerationType =
  | 'Default'
  | 'Pangaea'
  | 'Continent and Islands'
  | 'Two Continents'
  | 'Three Continents'
  | 'Four Continents'
  | 'Smoothed Random'
  | 'Archipelago'
  | 'Inner Sea';

export type MapShape = 'Hexagonal' | 'Flat Earth Hexagonal' | 'Rectangular';

export interface UncivJSON {
  barbarians: Barbarians;
  checksum: string;
  civilizations: Civilization[];
  currentPlayer: string;
  currentTurnStartTime: number;
  difficulty: GameDifficulty;
  gameId: string;
  gameParameters: GameParameters;
  historyStartTurn: number;
  lastUnitId: number;
  tileMap: TileMap;
  turns: number;
  version?: Version;
}

export interface Barbarians {
  encampments: Encampment[];
}

export interface Encampment {
  countdown: number;
  position: Position;
  spawnedUnits: number;
}

export interface Civilization {
  civConstructions: CivConstructions;
  civName: string;
  espionageManager: EspionageManager;
  exploredRegion: ExploredRegion;
  goldenAges: GoldenAges;
  greatPeople: GreatPeople;
  policies: Policies;
  questManager: QuestManager;
  religionManager: ReligionManager;
  ruinsManager: RuinsManager;
  tacticalAI: TacticalAi;
  tech: Tech;
  victoryManager: VictoryManager;
  cities?: City[];
  citiesCreated?: number;
  diplomacy?: Diplomacy;
  gold?: number;
  hasEverOwnedOriginalCapital?: boolean;
  lastSeenImprovement?: LastSeenImprovement;
  naturalWonders?: string[];
  notifications?: Notification[];
  notificationsLog?: NotificationsLog[];
  playerId?: string;
  playerType?: 'Human' | 'AI';
  popupAlerts?: PopupAlert[];
  proximity?: Proximity;
  statsHistory?: StatsHistory;
  totalCultureForContests?: number;
  totalFaithForContests?: number;
  hasMovedAutomatedUnits?: boolean;
  cityStatePersonality?: string;
  cityStateResource?: string;
  flagsCountdown?: CivFlagsCountdown;
  cityStateUniqueUnit?: string;
}

export interface CivConstructions {
  builtItemsWithIncreasingCost?: BuiltItemsWithIncreasingCost;
  freeBuildings?: FreeBuildings;
  freeStatBuildingsProvided?: FreeStatBuildingsProvided;
}

export interface BuiltItemsWithIncreasingCost {
  Warrior?: number;
  Scout?: number;
  Monument?: number;
  Worker?: number;
}

export interface FreeBuildings {
  [uuidv4: string]: {
    class: string;
    value: string;
  }[];
}
export interface FreeStatBuildingsProvided {
  Culture: Culture[];
}

export interface Culture {
  class: string;
  value: string;
}

export interface EspionageManager {}

export interface ExploredRegion {
  bottomRight?: BottomRight;
  topLeft?: TopLeft;
}

export interface BottomRight {
  x: number;
  y: number;
}

export interface TopLeft {
  x: number;
  y: number;
}

export interface GoldenAges {
  storedHappiness: number;
}

export interface GreatPeople {
  pointsForNextGreatGeneralCounter: PointsForNextGreatGeneralCounter;
}

export interface PointsForNextGreatGeneralCounter {
  'Great General': number;
}

export interface Policies {
  adoptedPolicies?: string[];
  cultureOfLast8Turns?: number[];
  numberOfAdoptedPolicies?: number;
  storedCulture?: number;
  shouldOpenPolicyPicker?: boolean;
}

export interface QuestManager {}

export interface ReligionManager {
  storedFaith?: number;
}

export interface RuinsManager {
  lastChosenRewards?: string[];
}

export interface TacticalAi {}

export interface Tech {
  techsResearched: string[];
  overflowScience?: number;
  scienceOfLast8Turns?: number[];
  techsInProgress?: TechsInProgress;
  techsToResearch?: string[];
}

export interface TechsInProgress {
  Archery?: number;
  Calendar?: number;
  Sailing?: number;
}

export interface VictoryManager {}

export interface City {
  cityConstructions: CityConstructions;
  connectedToCapitalStatus: string;
  espionage: Espionage;
  expansion: Expansion;
  flagsCountdown: FlagsCountdown;
  foundingCiv: string;
  id: string;
  isOriginalCapital: boolean;
  location: Location;
  name: string;
  population: Population;
  religion: Religion;
  tiles: Tile[];
  workedTiles: WorkedTile[];
  cityAIFocus?: string;
  shouldReassignPopulation?: boolean;
}

export interface CityConstructions {
  builtBuildings: string[];
  constructionQueue: string[];
  inProgressConstructions: InProgressConstructions;
  currentConstructionIsUserSet?: boolean;
}

export interface InProgressConstructions {
  Granary?: number;
  Monument?: number;
  Shrine?: number;
  Settler?: number;
}

export interface Espionage {}

export interface Expansion {
  cultureStored?: number;
}

export interface Location {
  x: number;
  y: number;
}

export interface Population {
  foodStored: number;
  population: number;
}

export interface Religion {
  pressures: Pressures;
}

export interface Pressures {
  'The religion of TheLegend27': number;
}

export interface Tile {
  x: number;
  y?: number;
}

export interface WorkedTile {
  x: number;
  y?: number;
}

export interface Diplomacy {
  [civName: string]: {
    diplomaticModifiers: DiplomaticModifiers;
    diplomaticStatus: string;
    otherCivName: string;
    flagsCountdown?: FlagsCountdown;
    influence?: number;
  };
}

export interface DiplomaticModifiers {
  YearsOfPeace: number;
}

export interface FlagsCountdown {
  ResourceDemand?: number;
  RecentlyPledgedProtection?: number;
  Bullied?: number;
  NotifiedAfraid?: number;
}

export interface LastSeenImprovement {
  '(-14,-9)'?: string;
  '(6,1)'?: string;
  '(4,-6)'?: string;
  '(1,-1)'?: string;
  '(-4,-6)'?: string;
}

export interface Notification {
  text: string;
  icons: string[];
  actions: Action[];
  category?: string;
}

export interface TechAction {
  techName: string;
}

export interface LocationAction {
  location: Location;
}

export interface NotificationsLog {
  notifications: Notification[];
  turn: number;
}

export interface LinkAction {
  url: string;
}

export interface Action {
  LocationAction?: LocationAction;
  MapUnitAction?: Location;
  CivilopediaAction?: CivilopediaAction;
  TechAction?: TechAction;
  LinkAction?: LinkAction;
}

export interface CivilopediaAction {
  link: string;
}

export interface PopupAlert {
  type: string;
  value: string;
}

export interface Proximity {
  Belgrade?: string;
  'The Ottomans'?: string;
  Milan?: string;
  Japan?: string;
  Antwerp?: string;
  France?: string;
  Lhasa?: string;
  Kabul?: string;
  Ur?: string;
}

export interface StatsHistory {
  [index: number]: string;
}

export interface CivFlagsCountdown {
  TurnsTillCityStateElection: number;
  RecentlyBullied?: number;
}

export interface GameParameters {
  enableRandomNationsPool: boolean;
  espionageEnabled: boolean;
  isOnlineMultiplayer: boolean;
  maxTurns: number;
  multiplayerServerUrl: string;
  noStartBias: boolean;
  players: Player[];
  randomNationsPool: string[];
  victoryTypes: VictoryType[];
}

export interface Player {
  chosenCiv?: string;
  playerId?: string;
  playerType?: string;
}

export interface TileMap {
  mapParameters: MapParameters;
  tileList: TileList[];
}

export interface MapParameters {
  createdWithVersion: string;
  legendaryStart: boolean;
  mapSize: MapSize;
  seed: number;
  strategicBalance: boolean;
  type: MapGenerationType;
  worldWrap: boolean;
}

export interface MapSize {
  height: number;
  name: string;
  radius: number;
  width: number;
}

export interface TileList {
  baseTerrain: string;
  continent?: number;
  exploredBy?: string[];
  position?: Position;
  resource?: string;
  resourceAmount?: number;
  terrainFeatures?: string[];
  militaryUnit?: MilitaryUnit;
  improvement?: string;
  history?: History;
  roadOwner?: string;
  hasBottomLeftRiver?: boolean;
  hasBottomRightRiver?: boolean;
  civilianUnit?: CivilianUnit;
  improvementQueue?: ImprovementQueue[];
  improvementInProgress?: string;
  turnsToImprovement?: number;
  hasBottomRiver?: boolean;
  naturalWonder?: string;
}

export interface MilitaryUnit {
  currentMovement?: number;
  id: number;
  movementMemories: MovementMemory[];
  name: string;
  originalOwner: string;
  owner: string;
  action?: string;
  turnsFortified?: number;
  health?: number;
  promotions?: Promotions;
  automated?: boolean;
}

export interface MovementMemory {
  position: Position;
}

export interface Promotions {
  XP?: number;
  promotions?: string[];
}

export interface History {
  [index: number]: string;
}

export interface CivilianUnit {
  currentMovement: number;
  id: number;
  movementMemories: MovementMemory[];
  name: string;
  originalOwner: string;
  owner: string;
}

export interface ImprovementQueue {
  improvement: string;
  turnsToImprovement: number;
}

export interface Version {
  number: number;
  createdWith: {
    text: string;
    number: number;
  };
}
