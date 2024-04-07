import fp from 'fastify-plugin';
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDISCLOUD_URL || process.env.REDIS_URL,
});

client.on('error', err => console.log('Redis Client Error', err));
client.on('ready', () => {
  console.log('Redis Server started on:', client.options?.url)
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
