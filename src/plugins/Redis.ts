import fp from 'fastify-plugin';
import { createClient } from 'redis';
import { expireAfter } from './Constants';

const filesCacheClient = createClient({
  url: process.env.REDIS_URL,
  database: 0,
});

const authCacheClient = createClient({
  url: process.env.REDIS_URL,
  database: 1,
});

const playerIdsCacheClient = createClient({
  url: process.env.REDIS_URL,
  database: 2,
});

filesCacheClient.on('error', err => console.log('Redis Client Error', err));
authCacheClient.on('error', err => console.log('Redis Client Error', err));
playerIdsCacheClient.on('error', err => console.log('Redis Client Error', err));

// type definations
declare module 'fastify' {
  interface FastifyInstance {
    cache: typeof cache;
  }
}

const cache = {
  files: {
    get: (url: string) => filesCacheClient.get(url),
    del: (url: string) => filesCacheClient.del(url),
    set: (url: string, data: string | Buffer, { sec, ms }: { sec?: number; ms?: number } = {}) =>
      filesCacheClient.set(url, data, ms ? { PX: ms } : { EX: sec ?? expireAfter }),
    client: filesCacheClient,
  },
  auth: {
    get: (userId: string) => authCacheClient.get(userId),
    set: (userId: string, hash: string) => authCacheClient.set(userId, hash),
    client: authCacheClient,
  },
  playerId: {
    get: (gameId: string) => playerIdsCacheClient.get(gameId),
    del: (gameId: string) => playerIdsCacheClient.del(gameId),
    set: (gameId: string, playerId: string) => playerIdsCacheClient.set(gameId, playerId),
    client: playerIdsCacheClient,
  },
};

export default fp(
  async function (server) {
    // connect redis clients
    await Promise.all([
      filesCacheClient.connect(),
      authCacheClient.connect(),
      playerIdsCacheClient.connect(),
    ]);

    server.decorate('cache', cache);
    console.log('Loaded Redis Plugin!');
  },
  { name: 'Redis' }
);
