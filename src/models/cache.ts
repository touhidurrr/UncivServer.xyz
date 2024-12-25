import type { UncivGameSchema } from '@services/mongodb';
import type { InferSchemaType } from 'mongoose';
export type CachedGame = Omit<Omit<InferSchemaType<typeof UncivGameSchema>, '_id'>, 'players'> & {
  players?: string[];
};

export abstract class CacheService {
  abstract ready(): Promise<void>;
  abstract get(key: string): Promise<CachedGame | null | undefined>;
  abstract set(key: string, value: CachedGame): Promise<void | boolean>;
  abstract del(key: string): Promise<boolean | number>;
}
