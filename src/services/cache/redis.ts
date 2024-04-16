import Redis from 'ioredis';
import { REDIS_DEFAULT_URL } from '@constants';

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

  async get(key: string): Promise<string | null> {
    return redis.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return redis.del(key);
  }
}

export default new RedisCacheService();
