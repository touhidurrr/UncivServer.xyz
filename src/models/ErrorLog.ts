import mongoose from 'mongoose';

const ErrorLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { collection: 'ErrorLogs', timestamps: { createdAt: true, updatedAt: false } }
);

export const ErrorLog = mongoose.model('ErrorLog', ErrorLogSchema);
