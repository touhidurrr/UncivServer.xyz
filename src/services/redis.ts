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

await redis.connect();
await redis.ping();

export const cache = redis;
