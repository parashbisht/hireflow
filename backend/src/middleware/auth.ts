import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserRole } from '../models/User';

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
  role?: UserRole;
  orgId?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      orgId: user.orgId.toString(),
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};