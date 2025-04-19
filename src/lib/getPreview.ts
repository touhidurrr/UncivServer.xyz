import type { UncivJSON } from '@localTypes/unciv';

export const getPreview = ({
  turns,
  gameId,
  difficulty,
  civilizations,
  currentPlayer,
  gameParameters,
  currentTurnStartTime,
}: UncivJSON) => ({
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
});
