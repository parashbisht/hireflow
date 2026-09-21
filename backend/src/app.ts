import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';

const app = express();

// ---- Global Middleware ----
app.use(helmet()); // sets safe HTTP headers
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev')); // request logging in the console
}

// ---- Health check route ----
// Useful to confirm the server + Docker setup is working correctly.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'HireFlow API is running',
    environment: env.nodeEnv,
  });
});

// ---- Feature routes will be mounted here in later phases ----
// e.g. app.use('/api/auth', authRoutes);
// e.g. app.use('/api/jobs', jobRoutes);
// e.g. app.use('/api/candidates', candidateRoutes);
// e.g. app.use('/api/dashboard', dashboardRoutes);
// e.g. app.use('/api/ai', aiRoutes);

// ---- 404 handler (for any unmatched route) ----
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// NOTE: A centralized error-handling middleware will be added in Phase 9.

export default app;
