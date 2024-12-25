import type { Civilization, UncivJSON } from '@localTypes/unciv';

export const getNextPlayerCivilization = (game: UncivJSON): Civilization | undefined => {
  const humanCivs = game.civilizations.filter(civ => civ.playerType === 'Human');
  const curPlayerIndex = humanCivs.findIndex(civ => civ.civName === game.currentPlayer);
  const civNameToSearch =
    curPlayerIndex < 0
      ? game.currentPlayer
      : humanCivs[(curPlayerIndex + 1) % humanCivs.length].civName;

  return humanCivs.find(civ => civ.civName === civNameToSearch);
};
