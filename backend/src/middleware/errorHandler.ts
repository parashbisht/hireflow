import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    ...(env.nodeEnv !== 'production' && { stack: err.stack }),
  });
};