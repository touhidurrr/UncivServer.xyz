import type { UncivJSON } from '@localTypes/unciv';

/**
 * Unpacks the given base64 Unciv game data a JSON string
 * @param data base64 string to be unpacked
 * @returns JSON string
 */
export const unpackJSON = (data: string): string =>
  Buffer.from(Bun.gunzipSync(Buffer.from(data, 'base64')).buffer).toString('utf8');

/**
 * Unpacks the given base64 Unciv game data string into an object
 * @param data base64 string to be unpacked
 * @returns Unpacked object
 */
export const unpack = (data: string): UncivJSON => JSON.parse(unpackJSON(data));

/**
 * Unpacks the given base64 Unciv game data file into an object
 * @param path path to the file
 * @returns Unpacked object
 */
export const unpackFromFile = async (path: string): Promise<UncivJSON> => {
  const data = await Bun.file(path).text();
  return unpack(data);
};

/**
 * Packs the given object into a base64 Unciv game data compatible string
 * @param data object to be packed
 * @returns Packed base64 string
 */
export const pack = (data: object): string => {
  const json = JSON.stringify(data);
  const compressed = Bun.gzipSync(json, { library: 'libdeflate', level: 7 });
  // return base64 string
  return Buffer.from(compressed).toBase64();
};

export const packToFile = (data: object, path: string) => Bun.write(path, pack(data));
