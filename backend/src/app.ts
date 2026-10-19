import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import candidateRoutes from './routes/candidateRoutes';
import './events/candidateEvents';
import dashboardRoutes from './routes/dashboardRoutes';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, aiRateLimiter } from './middleware/rateLimiter';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || (process.env.NODE_ENV === 'development' ? '*' : undefined),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'HireFlow API is running', environment: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/candidates', apiLimiter, candidateRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/ai', aiRateLimiter, aiRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;