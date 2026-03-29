import { UUID_REGEX } from '@constants';
import mongoose from 'mongoose';

const AuthSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, match: UUID_REGEX },
    hash: { type: String, required: true },
  },
  { collection: 'Auth', timestamps: true }
);

export const Auth = mongoose.model('Auth', AuthSchema);
