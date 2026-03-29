import mongoose from 'mongoose';

const { MONGO_URL = 'mongodb://localhost' } = process.env;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
  try {
    await mongoose.connect(MONGO_URL, {
      dbName: 'unciv',
      appName: 'UncivServer.xyz',
      retryWrites: true,
      compressors: ['zstd'],
    });
    console.log('✅ Successfully connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
