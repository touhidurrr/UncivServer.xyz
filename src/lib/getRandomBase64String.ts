import bytes from 'bytes';
import { randomBytes } from 'node:crypto';

export function getRandomBase64String(targetLength: number | string = 10): string {
  if (typeof targetLength === 'string') targetLength = bytes.parse(targetLength);
  const buffSize = Math.ceil((targetLength * 3) / 4);
  return randomBytes(buffSize).toString('base64');
}
