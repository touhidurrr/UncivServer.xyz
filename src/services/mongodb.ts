import mongoose from 'mongoose';

const { MONGO_URL = 'mongodb://localhost' } = process.env;

await mongoose.connect(MONGO_URL, {
  dbName: 'unciv',
  appName: 'UncivServer.xyz',
  retryWrites: true,
  compressors: ['zstd'],
});
