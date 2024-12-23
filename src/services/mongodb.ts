import { MongoClient } from 'mongodb';

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

if (!process.env.MONGO_URL) {
  console.error('[MongoDB] MONGO_URL not set.');
  process.exit(1);
}

const _client = new MongoClient(process.env.MONGO_URL, {
  compressors: ['zstd'],
  socketTimeoutMS: 30_000,
  retryWrites: true,
});

_client.once('open', () => {
  console.info('[MongoDB] Connected.');
});

_client.on('close', () => {
  console.error('[MongoDB] Connection closed!');
  process.exit(1);
});

_client.on('timeout', () => {
  console.error('[MongoDB] Timeout!');
  process.exit(1);
});

await _client.connect();
const _db = await _client.db('unciv');

const [UncivServer, PlayerProfiles, ErrorLogs] = await Promise.all([
  _db.collection<UncivGame>('UncivServer'),
  _db.collection<PlayerProfile>('PlayerProfiles'),
  _db.collection<ErrorLog>('ErrorLogs'),
]);

export const db = {
  _db,
  _client,
  UncivServer,
  PlayerProfiles,
  ErrorLogs,
};
