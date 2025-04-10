import { REDIS_DEFAULT_URL } from '@constants';
import { RedisClient } from 'bun';

const REDIS_URL = process.env.REDISCLOUD_URL || process.env.REDIS_URL || REDIS_DEFAULT_URL;

const redis = new RedisClient(REDIS_URL);

redis.onconnect = () => console.log(`[Redis] Connected to ${REDIS_URL}`);
redis.onclose = error => console.error(`[Redis] Connection closed. Reason:`, error);

class RedisCacheService implements CacheService {
  async ready() {
    await redis.connect();
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
