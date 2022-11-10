import fp from 'fastify-plugin';
import { type Collection, type Document, MongoClient } from 'mongodb';

// type definations
declare module 'fastify' {
  interface FastifyInstance {
    mongoClient: MongoClient;
    db: {
      UncivServer: Collection<Document>;
      PlayerProfiles: Collection<Document>;
    };
  }
}

export default fp(async function MongoDB(server) {
  const mongoClient = new MongoClient(process.env.MongoURL!);
  await mongoClient.connect();

  const db = {
    UncivServer: await mongoClient.db('unciv').collection('UncivServer'),
    PlayerProfiles: await mongoClient.db('unciv').collection('PlayerProfiles'),
  };

  server.decorate('mongoClient', mongoClient);
  server.decorate('db', db);

  console.log('Loaded MongoDB Plugin!');
});
