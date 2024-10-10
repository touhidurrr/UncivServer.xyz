import type { UncivJSON } from '@localTypes/unciv';

const dec = new TextDecoder();

export function parseUncivGameData(data: string): UncivJSON {
  //@ts-ignore
  const jsonArray = Bun.gunzipSync(Buffer.from(data, 'base64'));
  return JSON.parse(dec.decode(jsonArray));
}
