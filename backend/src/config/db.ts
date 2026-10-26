import { prisma } from '../lib/prisma';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to connect to PostgreSQL');
  }
  await prisma.$connect();
  console.log('PostgreSQL connected successfully');
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
};