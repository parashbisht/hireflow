import { Response } from 'express';
import mongoose from 'mongoose';
import { Candidate } from '../models/Candidate';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, jobId } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    const filter: Record<string, unknown> = {};
    if (status && ALLOWED_STATUSES.includes(String(status))) {
      filter.status = status;
    }
    if (jobId && mongoose.Types.ObjectId.isValid(String(jobId))) {
      filter.appliedJob = jobId;
    }
    if (search && String(search).trim() !== '') {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { skills: regex }];
    }

    const total = await Candidate.countDocuments(filter);
    const candidates = await Candidate.find(filter)
      .populate('appliedJob', 'title company')
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
    const candidate = await Candidate.findById(req.params.id).populate('appliedJob', 'title company');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, email, phone, location, skills, experience,
      resumeUrl, linkedinUrl, githubUrl, appliedJob, status, notes,
    } = req.body;

    if (!name || !email || !appliedJob) {
      return res.status(400).json({ success: false, message: 'name, email and appliedJob are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(appliedJob)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const candidate = await Candidate.create({
      name, email,
      phone: phone || '',
      location: location || '',
      skills: Array.isArray(skills) ? skills : [],
      experience: experience || '',
      resumeUrl: resumeUrl || '',
      linkedinUrl: linkedinUrl || '',
      githubUrl: githubUrl || '',
      appliedJob,
      status: status || 'APPLIED',
      notes: notes || '',
    });

    const populated = await candidate.populate('appliedJob', 'title company');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ success: false, message: firstError });
    }
    return res.status(500).json({ success: false, message: 'Failed to create candidate' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { appliedJob, status } = req.body;
    if (appliedJob && !mongoose.Types.ObjectId.isValid(appliedJob)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('appliedJob', 'title company');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ success: false, message: firstError });
    }
    return res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'A valid status is required' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('appliedJob', 'title company');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update candidate status' });
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