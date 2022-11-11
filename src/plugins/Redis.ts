import fp from 'fastify-plugin';
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on('error', err => console.log('Redis Client Error', err));

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
