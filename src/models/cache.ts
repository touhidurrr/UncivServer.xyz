import type { UncivGame } from '@services/mongodb';

export type CachedGame = Omit<UncivGame, '_id'>;

export abstract class CacheService {
  abstract ready(): Promise<void>;
  abstract get(key: string): Promise<CachedGame | null | undefined>;
  abstract set(key: string, value: CachedGame): Promise<void | boolean>;
  abstract del(key: string): Promise<boolean | number>;
}
