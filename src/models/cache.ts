export abstract class CacheService {
  abstract ready(): Promise<void>;
  abstract get(key: string): Promise<string | null | undefined>;
  abstract set(key: string, value: string): Promise<void | boolean>;
  abstract del(key: string): Promise<boolean | number>;
}
