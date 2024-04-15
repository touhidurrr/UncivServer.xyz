import fp from 'fastify-plugin';
import { Redis } from 'ioredis';

const REDIS_DEFAULT_URL = '0.0.0.0:6379';
const REDIS_URL = process.env.REDISCLOUD_URL || process.env.REDIS_URL || REDIS_DEFAULT_URL;
const client = new Redis(REDIS_URL);

client.on('error', err => console.log('Redis Client Error', err));
client.on('ready', () => {
  console.log(`Redis Server started on: ${client.options.host}:${client.options.port}`);
});

// type definations
declare module 'fastify' {
  interface FastifyInstance {
    redis: typeof client;
  }
}

export default fp(async function (server) {
  await client.connect();
  server.decorate('redis', client);
  console.log('Loaded Redis Plugin!');
});
