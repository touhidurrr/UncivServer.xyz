import type { UncivJSON } from '@localTypes/unciv';

export const unpackJSON = (data: string): string =>
  Buffer.from(Bun.gunzipSync(Buffer.from(data, 'base64')).buffer).toString('utf8');

export const unpack = (data: string): UncivJSON => JSON.parse(unpackJSON(data));

export const unpackFromFile = async (path: string): Promise<UncivJSON> => {
  const data = await Bun.file(path).text();
  return unpack(data);
};

export const pack = (data: object): string => {
  const json = JSON.stringify(data);
  const compressed = Bun.gzipSync(json, { library: 'libdeflate', level: 7 });
  // return base64 string
  return Buffer.from(compressed).toBase64();
};

export const packToFile = (data: object, path: string) => Bun.write(path, pack(data));
