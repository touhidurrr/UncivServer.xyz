import type { Civilization, UncivJSON } from '@localTypes/unciv';

export const getCurrentPlayerCivilization = (game: UncivJSON): Civilization | undefined =>
  game.civilizations.find(civ => civ.civName === game.currentPlayer);
