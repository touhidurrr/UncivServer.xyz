import { REDIS_DEFAULT_URL } from '@constants';
import Redis from 'ioredis';
import type { CachedGame, CacheService } from '../../models/cache';

const REDIS_URL = process.env.REDISCLOUD_URL || process.env.REDIS_URL || REDIS_DEFAULT_URL;

const redis = new Redis(REDIS_URL);

redis.on('error', error => {
  console.error(`[Redis] Error:`, error);
});

redis.on('close', () => {
  console.error(`[Redis] Connection closed.`);
});

class RedisCacheService implements CacheService {
  async ready() {
    await redis.connect();
    await redis.ping();
  }

  async get(key: string): Promise<CachedGame | null> {
    const json = await redis.get(key);
    return json ? JSON.parse(json) : null;
  }

  async set(key: string, value: CachedGame): Promise<void> {
    const json = JSON.stringify(value);
    await redis.set(key, json);
  }

  async del(key: string): Promise<number> {
    return redis.del(key);
  }
}

export default new RedisCacheService();
