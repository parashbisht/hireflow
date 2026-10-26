import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`🚀 HireFlow API running on http://localhost:${env.port}`);
    console.log(`   Environment: ${env.nodeEnv}`);
  });

  const shutdown = () => {
    server.close(() => {
      void disconnectDB().catch((error: unknown) => {
        console.error('Failed to disconnect from PostgreSQL:', error);
        process.exitCode = 1;
      });
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

void startServer().catch((error: unknown) => {
  console.error('Failed to start the server:', error);
  process.exitCode = 1;
});