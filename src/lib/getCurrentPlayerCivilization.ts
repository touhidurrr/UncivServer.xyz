import type { Civilization, UncivJSON } from '@localTypes/unciv';

export function getCurrentPlayerCivilization(game: UncivJSON): Civilization | undefined {
  return game.civilizations.find(civ => civ.civName === game.currentPlayer);
}
