import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized place to read environment variables.
 * Importing this file anywhere in the app guarantees dotenv has run
 * and gives us one place to see every config value the app needs.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Added in Phase 2 (MongoDB) and Phase 3 (Auth) — placeholders for now
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Added in Phase 8 (AI Resume Matcher)
  aiApiKey: process.env.AI_API_KEY || '',
  aiApiBaseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
};
