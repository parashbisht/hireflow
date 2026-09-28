import { Response } from 'express';
import { Job } from '../models/Job';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];
const ALLOWED_STATUSES = ['OPEN', 'CLOSED'];
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
const isOptionalText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length <= maxLength;

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const filter: Record<string, unknown> = {};
    if (status && ALLOWED_STATUSES.includes(String(status))) {
      filter.status = status;
    }
    if (search && String(search).trim() !== '') {
      const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$or = [{ title: regex }, { company: regex }, { requiredSkills: regex }];
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, company, location, employmentType, description, requiredSkills, experience, salaryRange, status } =
      req.body ?? {};

    if (!isText(title, 120)) {
      return res.status(400).json({ success: false, message: 'Title must be a non-empty string of at most 120 characters' });
    }
    if (!isText(company, 120)) {
      return res.status(400).json({ success: false, message: 'Company must be a non-empty string of at most 120 characters' });
    }
    if (!isText(location, 120)) {
      return res.status(400).json({ success: false, message: 'Location must be a non-empty string of at most 120 characters' });
    }
    if (typeof employmentType !== 'string' || !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (!isText(description, 10000)) {
      return res.status(400).json({ success: false, message: 'Description must be a non-empty string of at most 10000 characters' });
    }
    if (requiredSkills !== undefined && (
      !Array.isArray(requiredSkills) ||
      requiredSkills.length > 30 ||
      requiredSkills.some((skill) => !isText(skill, 50))
    )) {
      return res.status(400).json({ success: false, message: 'Required skills must be an array of up to 30 strings, each at most 50 characters' });
    }
    if (experience !== undefined && !isOptionalText(experience, 100)) {
      return res.status(400).json({ success: false, message: 'Experience must be a string of at most 100 characters' });
    }
    if (salaryRange !== undefined && !isOptionalText(salaryRange, 100)) {
      return res.status(400).json({ success: false, message: 'Salary range must be a string of at most 100 characters' });
    }
    if (status !== undefined && (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status))) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const job = await Job.create({
      title,
      company,
      location,
      employmentType,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      experience: experience || '',
      salaryRange: salaryRange || '',
      status: status || 'OPEN',
      createdBy: req.user!.id,
    });

    return res.status(201).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      company,
      location,
      employmentType,
      description,
      requiredSkills,
      experience,
      salaryRange,
      status,
    } = req.body;
    if (requiredSkills !== undefined && !Array.isArray(requiredSkills)) {
      return res.status(400).json({ success: false, message: 'requiredSkills must be an array' });
    }
    if (employmentType && !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updates = {
      ...(title !== undefined && { title }),
      ...(company !== undefined && { company }),
      ...(location !== undefined && { location }),
      ...(employmentType !== undefined && { employmentType }),
      ...(description !== undefined && { description }),
      ...(requiredSkills !== undefined && { requiredSkills }),
      ...(experience !== undefined && { experience }),
      ...(salaryRange !== undefined && { salaryRange }),
      ...(status !== undefined && { status }),
    };
    const job = await Job.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
};