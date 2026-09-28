import { Response } from 'express';
import mongoose from 'mongoose';
import { Candidate, type CandidateStage } from '../models/Candidate';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_STAGES: string[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { search, job, stage } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const filter: Record<string, unknown> = {};
    if (job) {
      if (!mongoose.Types.ObjectId.isValid(String(job))) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      filter.job = job;
    }
    if (stage && ALLOWED_STAGES.includes(String(stage))) {
      filter.stage = stage;
    }
    if (search && String(search).trim() !== '') {
      const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { skills: regex }];
    }

    const total = await Candidate.countDocuments(filter);
    const candidates = await Candidate.find(filter)
      .populate('job', 'title company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: candidates,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('job', 'title company');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, skills, experienceYears, resumeText, job, stage, notes } = req.body ?? {};

    if (!isText(name, 100)) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string of at most 100 characters' });
    }
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address (maximum 254 characters)' });
    }
    if (typeof job !== 'string' || !mongoose.Types.ObjectId.isValid(job)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) {
      return res.status(400).json({ success: false, message: 'Phone must be a string of at most 30 characters' });
    }
    if (skills !== undefined && (
      !Array.isArray(skills) ||
      skills.length > 30 ||
      skills.some((skill) => !isText(skill, 50))
    )) {
      return res.status(400).json({ success: false, message: 'Skills must be an array of up to 30 strings, each at most 50 characters' });
    }
    if (experienceYears !== undefined && (
      typeof experienceYears !== 'number' || !Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 80
    )) {
      return res.status(400).json({ success: false, message: 'Experience years must be a number between 0 and 80' });
    }
    if (resumeText !== undefined && (typeof resumeText !== 'string' || resumeText.length > 30000)) {
      return res.status(400).json({ success: false, message: 'Resume text must be a string of at most 30000 characters' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Notes must be a string of at most 5000 characters' });
    }
    if (stage !== undefined && (typeof stage !== 'string' || !ALLOWED_STAGES.includes(stage))) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const candidate = await Candidate.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      skills: skills || [],
      experienceYears: experienceYears ?? 0,
      resumeText: resumeText || '',
      job,
      stage: stage || 'APPLIED',
      notes: notes || '',
      createdBy: req.user!.id,
    });

    const populated = await candidate.populate('job', 'title company');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const message = error instanceof mongoose.Error.ValidationError
        ? Object.values(error.errors)[0]?.message || 'Validation failed'
        : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create candidate' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, skills, experienceYears, resumeText, job, stage, notes } = req.body;

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'skills must be an array' });
    }
    if (job !== undefined && !mongoose.Types.ObjectId.isValid(String(job))) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }
    if (stage !== undefined && !ALLOWED_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const updates = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills }),
      ...(experienceYears !== undefined && { experienceYears }),
      ...(resumeText !== undefined && { resumeText }),
      ...(job !== undefined && { job }),
      ...(stage !== undefined && { stage }),
      ...(notes !== undefined && { notes }),
    };
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('job', 'title company');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const message = error instanceof mongoose.Error.ValidationError
        ? Object.values(error.errors)[0]?.message || 'Validation failed'
        : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

export const updateStage = async (req: AuthRequest, res: Response) => {
  try {
    const { stage } = req.body;
    if (!stage || !ALLOWED_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'A valid stage is required' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { stage: stage as CandidateStage },
      { new: true, runValidators: true }
    ).populate('job', 'title company');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update candidate stage' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};