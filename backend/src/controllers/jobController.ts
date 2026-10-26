import { EmploymentType, JobStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { isUuid } from '../utils/isUuid';

const ALLOWED_EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];
const ALLOWED_STATUSES: JobStatus[] = ['OPEN', 'CLOSED'];
const isText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
const isOptionalText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.length <= maxLength;

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const where: Prisma.JobWhereInput = { organizationId: req.user!.orgId };

    if (status && ALLOWED_STATUSES.includes(String(status) as JobStatus)) {
      where.status = String(status) as JobStatus;
    }
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
        { requiredSkills: { has: searchTerm } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, organizationId: req.user!.orgId },
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, data: job });
  } catch (_error) {
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
    if (typeof employmentType !== 'string' || !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType as EmploymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (!isText(description, 10000)) {
      return res.status(400).json({ success: false, message: 'Description must be a non-empty string of at most 10000 characters' });
    }
    if (
      requiredSkills !== undefined &&
      (!Array.isArray(requiredSkills) ||
        requiredSkills.length > 30 ||
        requiredSkills.some((skill) => !isText(skill, 50)))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required skills must be an array of up to 30 strings, each at most 50 characters',
      });
    }
    if (experience !== undefined && !isOptionalText(experience, 100)) {
      return res.status(400).json({ success: false, message: 'Experience must be a string of at most 100 characters' });
    }
    if (salaryRange !== undefined && !isOptionalText(salaryRange, 100)) {
      return res.status(400).json({ success: false, message: 'Salary range must be a string of at most 100 characters' });
    }
    if (status !== undefined && (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status as JobStatus))) {
      return res.status(400).json({ success: false, message: 'Invalid job status' });
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        employmentType: employmentType as EmploymentType,
        description,
        requiredSkills: requiredSkills ?? [],
        experience: experience || '',
        salaryRange: salaryRange || '',
        status: (status as JobStatus | undefined) ?? 'OPEN',
        organizationId: req.user!.orgId,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json({ success: true, data: job });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }

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
    } = req.body ?? {};

    if (title !== undefined && !isText(title, 120)) {
      return res.status(400).json({ success: false, message: 'Title must be a non-empty string of at most 120 characters' });
    }
    if (company !== undefined && !isText(company, 120)) {
      return res.status(400).json({ success: false, message: 'Company must be a non-empty string of at most 120 characters' });
    }
    if (location !== undefined && !isText(location, 120)) {
      return res.status(400).json({ success: false, message: 'Location must be a non-empty string of at most 120 characters' });
    }
    if (description !== undefined && !isText(description, 10000)) {
      return res.status(400).json({ success: false, message: 'Description must be a non-empty string of at most 10000 characters' });
    }
    if (
      requiredSkills !== undefined &&
      (!Array.isArray(requiredSkills) ||
        requiredSkills.length > 30 ||
        requiredSkills.some((skill) => !isText(skill, 50)))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required skills must be an array of up to 30 strings, each at most 50 characters',
      });
    }
    if (employmentType !== undefined && !ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type' });
    }
    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid job status' });
    }
    if (experience !== undefined && !isOptionalText(experience, 100)) {
      return res.status(400).json({ success: false, message: 'Experience must be a string of at most 100 characters' });
    }
    if (salaryRange !== undefined && !isOptionalText(salaryRange, 100)) {
      return res.status(400).json({ success: false, message: 'Salary range must be a string of at most 100 characters' });
    }

    const result = await prisma.job.updateMany({
      where: { id: req.params.id, organizationId: req.user!.orgId },
      data: {
        ...(title !== undefined && { title }),
        ...(company !== undefined && { company }),
        ...(location !== undefined && { location }),
        ...(employmentType !== undefined && { employmentType }),
        ...(description !== undefined && { description }),
        ...(requiredSkills !== undefined && { requiredSkills }),
        ...(experience !== undefined && { experience }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(status !== undefined && { status }),
      },
    });

    if (result.count === 0) return res.status(404).json({ success: false, message: 'Job not found' });
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    return res.status(200).json({ success: true, data: job });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to update job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }

    const where = { id: req.params.id, organizationId: req.user!.orgId };
    const job = await prisma.job.findFirst({ where, select: { id: true } });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const candidateCount = await prisma.candidate.count({ where: { jobId: job.id } });
    if (candidateCount > 0) {
      return res.status(409).json({ success: false, message: 'Cannot delete a job that has candidates' });
    }

    await prisma.job.delete({ where: { id: job.id } });
    return res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
};
