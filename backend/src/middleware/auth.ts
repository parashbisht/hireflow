import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { isUuid } from '../utils/isUuid';

export interface AuthUser {
  id: string;
  role: UserRole;
  orgId: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  id: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  let decoded: JwtPayload;
  try {
    const payload = jwt.verify(authHeader.slice(7), env.jwtSecret);
    if (typeof payload === 'string' || typeof payload.id !== 'string') {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
    decoded = payload as JwtPayload;
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }

  if (!isUuid(decoded.id)) {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      orgId: user.organizationId,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
