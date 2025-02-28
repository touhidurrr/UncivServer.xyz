import { TEST_GAME_ID } from '@constants';
import { pack } from '@services/uncivGame';
import bytes from 'bytes';
import { getRandomBase64String } from './getRandomBase64String';

export const getRandomSave = (size: number | string): string => {
  if (typeof size === 'string') {
    const parsedSize = bytes.parse(size);
    if (parsedSize === null) {
      throw new Error('Unable to parse target length');
    }
    size = parsedSize;
  }

  let save = '';
  let mid = 0;
  let low = 0;
  let high = size * 2;

  let i = 0;
  while (low <= high && i < 20) {
    i += 1;
    mid = low + Math.floor((high - low) / 2);
    save = pack({
      gameId: TEST_GAME_ID,
      civilizations: [],
      gameParameters: { players: [] },
      version: { number: 0 },
      data: getRandomBase64String(mid),
    });

    if (save.length < size) low = mid + 1;
    else if (save.length > size) high = mid - 1;
    else return save;
  }

  return save;
};
