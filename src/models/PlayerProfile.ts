import { INITIAL_MU, INITIAL_SIGMA, NUMERIC_REGEX, UUID_REGEX } from '@constants';
import mongoose from 'mongoose';

const PlayerProfileSchema = new mongoose.Schema(
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

export const PlayerProfile = mongoose.model('PlayerProfile', PlayerProfileSchema);
