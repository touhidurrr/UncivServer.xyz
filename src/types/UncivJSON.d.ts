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

export type WorldSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Custom';

export interface UncivJSON {
  version: {
    number: number;
    createdWith: {
      text: string;
      number: number;
    };
  };
  civilizations: {
    playerType?: 'Human';
    playerId?: string;
    gold: number;
    civName: string;
    civName: string;
    tech: { techsResearched: string[] };
    exploredTiles: Position[];
  }[];
  barbarians: {
    camps: {
      class: 'com.unciv.json.HashMapVector2';
      entries: [
        Position,
        {
          class: 'com.unciv.logic.Encampment';
          position: Position;
          spawnedUnits: number;
        },
      ][];
    };
  };
  difficulty: GameDifficulty;
  tileMap: {
    mapParameters: {
      type: MapGenerationType;
      shape: MapShape;
      mapSize: { radius: number; width: number; height: number; name: WorldSize };
      mapResources: string;
      worldWrap: true;
      createdWithVersion: string;
      seed: number;
      waterThreshold: number;
    };
    tileList: {
      civilianUnit?: {
        owner: string;
        originalOwner: string;
        name: string;
        movementMemories?: { position: Position }[];
      };
      militaryUnit?: {
        owner: string;
        originalOwner: string;
        name: string;
        movementMemories?: { position: Position }[];
      };
      position: Position;
      baseTerrain: string;
      resource: string;
      resourceAmount: number;
      terrainFeatures: string[];
      continent: number;
    }[];
  };
  gameParameters: {
    difficulty: GameDifficulty;
    players: { playerType: 'Human'; playerId: string }[];
    numberOfCityStates: number;
    ragingBarbarians: boolean;
    victoryTypes: VictoryType[];
    isOnlineMultiplayer: boolean;
  };
  turns: number;
  currentPlayer: string;
  currentTurnStartTime: number;
  gameId: string;
}
