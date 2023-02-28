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

filesCacheClient.on('error', err => console.log('Redis Client Error', err));
authCacheClient.on('error', err => console.log('Redis Client Error', err));

// type definations
declare module 'fastify' {
  interface FastifyInstance {
    cache: typeof cache;
  }
}

function getCachedFile(url: string) {
  return filesCacheClient.get(url);
}

function setCachedFile(
  url: string,
  data: string | Buffer,
  { sec, ms }: { sec?: number; ms?: number } = {}
) {
  return filesCacheClient.set(url, data, ms ? { PX: ms } : { EX: sec ?? expireAfter });
}

function deleteCachedFile(url: string) {
  return filesCacheClient.del(url);
}

function getAuth(userId: string) {
  return authCacheClient.get(userId);
}

function setAuth(userId: string, hash: string) {
  return authCacheClient.set(userId, hash);
}

const cache = {
  files: {
    get: getCachedFile,
    set: setCachedFile,
    del: deleteCachedFile,
    client: filesCacheClient,
  },
  auth: {
    get: getAuth,
    set: setAuth,
    client: authCacheClient,
  },
};

export default fp(async function (server) {
  // connect redis clients
  await Promise.all([filesCacheClient.connect(), await authCacheClient.connect()]);

  server.decorate('cache', cache);
  console.log('Loaded Redis Plugin!');
});
