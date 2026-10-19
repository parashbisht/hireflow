import { Request, Response } from 'express';
import { User, type UserRole } from '../models/User';
import { Organization } from '../models/Organization';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'RECRUITER', 'VIEWER'];

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
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const orgName =
      typeof organizationName === 'string' && organizationName.trim().length > 0
        ? organizationName.trim().slice(0, 100)
        : `${name.trim()}'s Workspace`;

    const organization = await Organization.create({ name: orgName });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'ADMIN',
      orgId: organization._id,
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
  } catch (_error) {
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

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role, user.orgId.toString());

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId.toString(),
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
    const user = await User.findById(req.user?.id);
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
        orgId: user.orgId.toString(),
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

    const assignedRole: UserRole = role && ALLOWED_ROLES.includes(role) ? role : 'RECRUITER';

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      orgId: req.user!.orgId,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId.toString(),
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to create user in organization' });
  }
};