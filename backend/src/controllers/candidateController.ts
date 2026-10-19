import { Response } from 'express';
import mongoose from 'mongoose';
import { Candidate, type CandidateStage } from '../models/Candidate';
import { Job } from '../models/Job';
import { AuthRequest } from '../middleware/auth';
import { candidateEventEmitter, CANDIDATE_HIRED } from '../events/candidateEvents';
import { generateInvoice, logNotification, invoicePath } from '../services/invoiceService';

// Register invoice generation listener (fire-and-forget; request never awaits it)
candidateEventEmitter.on(CANDIDATE_HIRED, async ({ orgId, candidateId }) => {
  try {
    await generateInvoice(orgId, candidateId);
    await logNotification(orgId, candidateId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Invoice listener failed]', err);
  }
});

const ALLOWED_STAGES: string[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

const encodeCursor = (doc: { createdAt: Date; _id: mongoose.Types.ObjectId | string }): string => {
  return Buffer.from(
    JSON.stringify({ createdAt: doc.createdAt.toISOString(), id: doc._id.toString() })
  ).toString('base64url');
};

const decodeCursor = (cursor: string): { createdAt: Date; id: string } | null => {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.createdAt === 'string' && typeof parsed.id === 'string') {
      const date = new Date(parsed.createdAt);
      if (!isNaN(date.getTime()) && mongoose.Types.ObjectId.isValid(parsed.id)) {
        return { createdAt: date, id: parsed.id };
      }
    }
  } catch {
    return null;
  }
  return null;
};

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.orgId;
    const { search, job, stage, cursor } = req.query;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const baseFilter: Record<string, unknown> = { orgId };
    if (job) {
      if (!mongoose.Types.ObjectId.isValid(String(job))) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      baseFilter.job = job;
    }
    if (stage && ALLOWED_STAGES.includes(String(stage))) {
      baseFilter.stage = stage;
    }

    let cursorCondition: Record<string, unknown> | null = null;
    if (cursor) {
      const decoded = decodeCursor(String(cursor));
      if (!decoded) {
        return res.status(400).json({ success: false, message: 'Invalid cursor parameter' });
      }
      cursorCondition = {
        $or: [
          { createdAt: { $lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, _id: { $lt: new mongoose.Types.ObjectId(decoded.id) } },
        ],
      };
    }

    const searchStr = typeof search === 'string' ? search.trim() : '';

    const executeQuery = async (searchFilter: Record<string, unknown>) => {
      const conditions: Record<string, unknown>[] = [baseFilter];
      if (Object.keys(searchFilter).length > 0) {
        conditions.push(searchFilter);
      }
      if (cursorCondition) {
        conditions.push(cursorCondition);
      }

      const combinedFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };

      return Candidate.find(combinedFilter)
        .populate('job', 'title company')
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1);
    };

    let candidates = [];

    if (searchStr !== '') {
      try {
        candidates = await executeQuery({ $text: { $search: searchStr } });
        if (candidates.length === 0) {
          const prefixRegex = new RegExp(`^${escapeRegex(searchStr)}`, 'i');
          candidates = await executeQuery({
            $or: [{ name: prefixRegex }, { email: prefixRegex }],
          });
        }
      } catch (_err) {
        const prefixRegex = new RegExp(`^${escapeRegex(searchStr)}`, 'i');
        candidates = await executeQuery({
          $or: [{ name: prefixRegex }, { email: prefixRegex }],
        });
      }
    } else {
      candidates = await executeQuery({});
    }

    const hasMore = candidates.length > limit;
    const data = hasMore ? candidates.slice(0, limit) : candidates;
    const nextCursor = hasMore && data.length > 0 ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      data,
      nextCursor,
      hasMore,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, orgId: req.user!.orgId }).populate(
      'job',
      'title company'
    );
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.orgId;
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

    // Verify job belongs to user's organization
    const jobDoc = await Job.findOne({ _id: job, orgId });
    if (!jobDoc) {
      return res.status(400).json({ success: false, message: 'Invalid job for this organization' });
    }

    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) {
      return res.status(400).json({ success: false, message: 'Phone must be a string of at most 30 characters' });
    }
    if (
      skills !== undefined &&
      (!Array.isArray(skills) ||
        skills.length > 30 ||
        skills.some((skill) => !isText(skill, 50)))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array of up to 30 strings, each at most 50 characters',
      });
    }
    if (
      experienceYears !== undefined &&
      (typeof experienceYears !== 'number' ||
        !Number.isFinite(experienceYears) ||
        experienceYears < 0 ||
        experienceYears > 80)
    ) {
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
      orgId,
      createdBy: req.user!.id,
    });

    const populated = await candidate.populate('job', 'title company');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const message =
        error instanceof mongoose.Error.ValidationError
          ? Object.values(error.errors)[0]?.message || 'Validation failed'
          : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create candidate' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const orgId = req.user!.orgId;
    const { name, email, phone, skills, experienceYears, resumeText, job, stage, notes } = req.body ?? {};

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'skills must be an array' });
    }
    if (job !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(String(job))) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const jobDoc = await Job.findOne({ _id: job, orgId });
      if (!jobDoc) {
        return res.status(400).json({ success: false, message: 'Invalid job for this organization' });
      }
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

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, orgId },
      updates,
      { new: true, runValidators: true }
    ).populate('job', 'title company');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      const message =
        error instanceof mongoose.Error.ValidationError
          ? Object.values(error.errors)[0]?.message || 'Validation failed'
          : error.message;
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

export const updateStage = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const { stage } = req.body ?? {};
    if (!stage || !ALLOWED_STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'A valid stage is required' });
    }

    const existing = await Candidate.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!existing) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const previousStage = existing.stage;
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user!.orgId },
      { stage: stage as CandidateStage },
      { new: true, runValidators: true }
    ).populate('job', 'title company');

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Emit candidate.hired event fire-and-forget when moving TO HIRED from non-HIRED
    if (stage === 'HIRED' && previousStage !== 'HIRED') {
      candidateEventEmitter.emit(CANDIDATE_HIRED, {
        orgId: req.user!.orgId,
        candidateId: candidate._id.toString(),
      });
    }

    return res.status(200).json({ success: true, data: candidate });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to update candidate stage' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const candidate = await Candidate.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const orgId = req.user!.orgId;
    const { createReadStream } = await import('fs');
    const invoiceFilePath = invoicePath(orgId, req.params.id);

    const fs = await import('fs');
    if (!fs.existsSync(invoiceFilePath)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.id}.pdf`);
    const stream = createReadStream(invoiceFilePath);
    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to read invoice' });
      }
    });
    return;
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
};