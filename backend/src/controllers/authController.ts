import bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateToken } from '../utils/generateToken';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'RECRUITER', 'VIEWER'];

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, organizationName } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be between 1 and 100 characters' });
    }
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address (maximum 254 characters)' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const orgName =
      typeof organizationName === 'string' && organizationName.trim().length > 0
        ? organizationName.trim().slice(0, 100)
        : `${name.trim()}'s Workspace`;
    const passwordHash = await bcrypt.hash(password, 10);

    const { organization, user } = await prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({ data: { name: orgName } });
      const user = await transaction.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      });
      return { organization, user };
    });

    const token = generateToken(user.id, user.role, organization.id);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: organization.id,
          organizationName: organization.name,
        },
        token,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address (maximum 254 characters)' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role, user.organizationId);
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.organizationId,
        },
        token,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.organizationId,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const createUserInOrg = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be between 1 and 100 characters' });
    }
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address (maximum 254 characters)' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });
    }

    const assignedRole: UserRole = ALLOWED_ROLES.includes(role) ? role : 'RECRUITER';
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: assignedRole,
        organizationId: req.user!.orgId,
      },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.organizationId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create user in organization' });
  }
};
