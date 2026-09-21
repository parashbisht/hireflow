import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connects to MongoDB using Mongoose.
 * Called once when the server starts (see server.ts).
 */
export const connectDB = async (): Promise<void> => {
  if (!env.mongoUri) {
    console.error('❌ MONGO_URI is not set in your .env file.');
    console.error('   Add your MongoDB Atlas connection string to backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Optional but useful: log if the connection drops later (e.g. network blip)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});