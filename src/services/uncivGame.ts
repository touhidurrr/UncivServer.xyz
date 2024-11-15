import type { UncivJSON } from '@localTypes/unciv';

export function unpack(data: string): UncivJSON {
  //@ts-ignore
  const jsonArray = Bun.gunzipSync(Buffer.from(data, 'base64'));
  const jsonText = Buffer.from(jsonArray.buffer).toString('utf8');
  return JSON.parse(jsonText);
}

export async function unpackFromFile(path: string): Promise<UncivJSON> {
  const data = await Bun.file(path).text();
  return unpack(data);
}

export function pack(data: object): string {
  const json = JSON.stringify(data);
  const compressed = Bun.gzipSync(json);
  // return base64 string
  return Buffer.from(compressed).toString('base64');
}

export async function packToFile(data: object, path: string): Promise<void> {
  await Bun.write(path, pack(data));
}
