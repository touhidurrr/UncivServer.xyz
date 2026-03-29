import { GAME_ID_REGEX, UUID_REGEX } from '@constants';
import mongoose from 'mongoose';

const UncivGameSchema = new mongoose.Schema(
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

export const UncivGame = mongoose.model('UncivGame', UncivGameSchema);
