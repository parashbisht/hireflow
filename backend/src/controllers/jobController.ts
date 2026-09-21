import { Response } from 'express';
import { Job } from '../models/Job';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];
const ALLOWED_STATUSES = ['OPEN', 'CLOSED'];

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    const filter: Record<string, unknown> = {};
    if (status && ALLOWED_STATUSES.includes(String(status))) {
      filter.status = status;
    }
    if (search && String(search).trim() !== '') {
      const regex = new RegExp(String(search).trim(), 'i');
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
      req.body;

    if (!title || !company || !location || !employmentType || !description) {
      return res.status(400).json({
        success: false,
        message: 'title, company, location, employmentType and description are required',
      });
    }
    if (!ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
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
    });

    return res.status(201).json({ success: true, data: job });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { employmentType, status } = req.body;
    if (employmentType && !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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