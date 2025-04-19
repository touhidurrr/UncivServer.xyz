import type { UncivJSON } from '@localTypes/unciv';

export const getPlayers = (game: UncivJSON) =>
  [
    ...new Set(
      [
        ...game.civilizations.map(c => c.playerId),
        ...game.gameParameters?.players?.map(p => p.playerId),
      ].filter(Boolean)
    ),
  ] as string[];
