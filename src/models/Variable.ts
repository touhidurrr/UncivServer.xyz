import mongoose from 'mongoose';

const VariableSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { collection: 'Variables', timestamps: true }
);

export const Variable = mongoose.model('Variable', VariableSchema);
