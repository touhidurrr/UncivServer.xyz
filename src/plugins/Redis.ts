import fp from 'fastify-plugin';
import { createClient } from 'redis';

const client = createClient();
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
