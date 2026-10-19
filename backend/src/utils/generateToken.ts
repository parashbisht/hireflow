import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (userId: string, role: string, orgId: string): string => {
  return jwt.sign({ id: userId, role, orgId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
};