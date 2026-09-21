import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`🚀 HireFlow API running on http://localhost:${env.port}`);
    console.log(`   Environment: ${env.nodeEnv}`);
  });
};

startServer();