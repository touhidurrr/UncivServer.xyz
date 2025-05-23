import { GAME_ID_REGEX, GAME_ID_WITH_PREVIEW_REGEX } from '@constants';
import mongoose, { Schema } from 'mongoose';

await mongoose.connect(process.env.MONGO_URL!, {
  dbName: 'unciv',
  appName: 'UncivServer.xyz',
  retryWrites: true,
  compressors: ['zstd'],
});

const UncivGameSchema = new Schema(
  {
    _id: { type: String, required: true, match: GAME_ID_WITH_PREVIEW_REGEX },
    text: { type: String, default: '', required: true },
    name: String,
    currentPlayer: String,
    playerId: { type: String, match: GAME_ID_REGEX },
    players: { type: [{ type: String, match: GAME_ID_REGEX }] },
    turns: Number,
  },
  { collection: 'UncivServer', timestamps: true }
);

const PlayerProfileSchema = new Schema(
  {
    _id: { type: String, required: true },
    games: {
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      played: { type: Number, default: 0 },
      winPercentage: { type: Number, default: null },
    },
    rating: { type: Number, default: null },
    uncivUserIds: { type: [{ type: String, match: GAME_ID_REGEX }], default: [] },
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

export const db = {
  UncivGame,
  PlayerProfile,
  ErrorLog,
  Variable,
  Auth,
};

export default db;
