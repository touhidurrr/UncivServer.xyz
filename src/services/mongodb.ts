import { GAME_ID_REGEX, INITIAL_MU, INITIAL_SIGMA, NUMERIC_REGEX, UUID_REGEX } from '@constants';
import mongoose, { Schema } from 'mongoose';

mongoose.connect(process.env.MONGO_URL!, {
  dbName: 'unciv',
  appName: 'UncivServer.xyz',
  retryWrites: true,
  compressors: ['zstd'],
});

const UncivGameSchema = new Schema(
  {
    _id: { type: String, required: true, match: GAME_ID_REGEX },
    text: { type: String, default: '', required: true },
    name: String,
    currentPlayer: String,
    playerId: { type: String, match: UUID_REGEX },
    players: { type: [{ type: String, match: UUID_REGEX }] },
    turns: Number,
  },
  { collection: 'UncivServer', timestamps: true }
);

const PlayerProfileSchema = new Schema(
  {
    _id: { type: String, required: true, match: NUMERIC_REGEX },
    games: {
      won: { type: Number, default: 0 },
      played: { type: Number, default: 0 },
    },
    rating: {
      cur: { type: Number, default: null },
      peak: { type: Number, default: null },
      mu: { type: Number, default: INITIAL_MU },
      sigma: { type: Number, default: INITIAL_SIGMA },
    },
    uncivUserIds: { type: [{ type: String, match: UUID_REGEX }], default: [] },
    notifications: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
    dmChannel: String,
  },
  { collection: 'PlayerProfiles', timestamps: true }
);

const ErrorLogSchema = new Schema(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { collection: 'ErrorLogs', timestamps: { createdAt: true, updatedAt: false } }
);

const VariableSchema = new Schema(
  {
    _id: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { collection: 'Variables', timestamps: true }
);

const AuthSchema = new Schema(
  {
    _id: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { collection: 'Auth', timestamps: true }
);

export const UncivGame = mongoose.model('UncivGame', UncivGameSchema);
export const PlayerProfile = mongoose.model('PlayerProfile', PlayerProfileSchema);
export const ErrorLog = mongoose.model('ErrorLog', ErrorLogSchema);
export const Variable = mongoose.model('Variable', VariableSchema);
export const Auth = mongoose.model('Auth', AuthSchema);

export const stats = () => mongoose.connection.db?.stats();

export const db = {
  UncivGame,
  PlayerProfile,
  ErrorLog,
  Variable,
  Auth,
  stats,
};

export default db;
