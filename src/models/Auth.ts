import { UUID_REGEX } from '@constants';
import mongoose from 'mongoose';

const AuthSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, match: UUID_REGEX },
    hash: { type: String, required: true, minLength: 1 },
    email: { type: String, minLength: 1 }, // hashed email

    // for reset rate limit
    resetAttempts: Number,
    resetLockMs: Number,
    resetLockedUntil: Date,
  },
  { collection: 'Auth', timestamps: true }
);

export const Auth = mongoose.model('Auth', AuthSchema);
