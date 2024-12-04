import bytes from 'bytes';
import { randomBytes } from 'node:crypto';

export function getRandomBase64String(targetLength: number | string = 10): string {
  if (typeof targetLength === 'string') {
    const parsedByteLength = bytes.parse(targetLength);
    if (parsedByteLength === null) {
      throw new Error('Unable to parse target length');
    }
    targetLength = parsedByteLength;
  }
  const buffSize = Math.ceil((targetLength * 3) / 4);
  return randomBytes(buffSize).toString('base64');
}
