import random from 'random';

export function getRandomColor() {
  return random.int(0x000000, 0xffffff);
}
