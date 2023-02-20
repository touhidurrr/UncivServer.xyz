import fp from 'fastify-plugin';
import { MongoClient, type Collection } from 'mongodb';

// type definations
declare module 'fastify' {
  interface FastifyInstance {
    mongoClient: MongoClient;
    db: {
      ErrorLogs: Collection<ErrorLog>;
      UncivServer: Collection<UncivGame>;
      PlayerProfiles: Collection<PlayerProfile>;
    };
  }
}

interface UncivGame {
  _id: string;
  text: string;
  timestamp: number;
  name?: string;
  currentPlayer?: string;
  playerId?: string;
  players?: string[];
  turns?: number;
}

interface PlayerProfile {
  _id: string;
  uncivUserIds: string[];
  games: {
    won: number;
    lost: number;
    played: number;
    winPercentage: number | null;
  };
  rating: number | null;
  notifications: 'enabled' | 'disabled';
  dmChannel?: string;
}

interface ErrorLog {
  type: string;
  timestamp: number;
  data: any;
}

export default fp(async function MongoDB(server) {
  const mongoClient = new MongoClient(process.env.MongoURL!);
  await mongoClient.connect();

  const db = {
    ErrorLogs: await mongoClient.db('unciv').collection<ErrorLog>('ErrorLogs'),
    UncivServer: await mongoClient.db('unciv').collection<UncivGame>('UncivServer'),
    PlayerProfiles: await mongoClient.db('unciv').collection<PlayerProfile>('PlayerProfiles'),
  };

  server.decorate('mongoClient', mongoClient);
  server.decorate('db', db);

  console.log('Loaded MongoDB Plugin!');
});
