import { TEST_GAME_ID } from '@constants';
import { pack } from '@services/uncivJSON';
import bytes from 'bytes';
import { getRandomBase64String } from './getRandomBase64String';

type SaveGameOptions =
  | {
      gameId?: string;
      userId?: string;
    }
  | undefined;

export const getRandomSave = (
  size: number | string,
  { gameId = TEST_GAME_ID, userId: playerId = TEST_GAME_ID }: SaveGameOptions = {}
): string => {
  if (typeof size === 'string') {
    const parsedSize = bytes.parse(size);
    if (parsedSize === null) {
      throw new Error('Unable to parse target length');
    }
    size = parsedSize;
  }

  let mid;
  let low = 0;
  let high = size * 2;
  let save = '';

  let i = 0;
  while (low <= high && i < 20) {
    i += 1;
    mid = low + Math.floor((high - low) / 2);
    save = pack({
      gameId,
      currentPlayer: 'Unknown',
      civilizations: [{ civName: 'Unknown', playerId }],
      gameParameters: { players: [{ playerId }] },
      data: getRandomBase64String(mid),
    });

    if (save.length < size) {
      if (size - save.length <= 4) {
        return save;
      }
      low = mid + 1;
    } else if (save.length > size) high = mid - 1;
    else return save;
  }

  return save;
};
