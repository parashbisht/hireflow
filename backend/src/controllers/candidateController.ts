import { CandidateStage, Prisma } from '@prisma/client';
import { Response } from 'express';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { candidateEventEmitter, CANDIDATE_HIRED } from '../events/candidateEvents';
import { prisma } from '../lib/prisma';
import { generateInvoice, invoicePath, logNotification } from '../services/invoiceService';
import { isUuid } from '../utils/isUuid';

candidateEventEmitter.on(CANDIDATE_HIRED, async ({ orgId, candidateId }) => {
  try {
    await generateInvoice(orgId, candidateId);
    await logNotification(orgId, candidateId);
  } catch (error) {
    console.error('[Invoice listener failed]', error);
  }
});

const ALLOWED_STAGES: CandidateStage[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isText = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

const encodeCursor = (candidate: { createdAt: Date; id: string }): string =>
  Buffer.from(JSON.stringify({ createdAt: candidate.createdAt.toISOString(), id: candidate.id })).toString('base64url');

const decodeCursor = (cursor: string): { createdAt: Date; id: string } | null => {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'createdAt' in parsed &&
      'id' in parsed &&
      typeof parsed.createdAt === 'string' &&
      typeof parsed.id === 'string' &&
      isUuid(parsed.id)
    ) {
      const createdAt = new Date(parsed.createdAt);
      if (!Number.isNaN(createdAt.getTime())) return { createdAt, id: parsed.id };
    }
  } catch {
    return null;
  }
  return null;
};

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { search, job, stage, cursor } = req.query;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const conditions: Prisma.CandidateWhereInput[] = [{ organizationId: req.user!.orgId }];

    if (job) {
      if (typeof job !== 'string' || !isUuid(job)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      conditions.push({ jobId: job });
    }
    if (stage) {
      if (typeof stage !== 'string' || !ALLOWED_STAGES.includes(stage as CandidateStage)) {
        return res.status(400).json({ success: false, message: 'Invalid candidate stage' });
      }
      conditions.push({ stage: stage as CandidateStage });
    }
    if (cursor) {
      const decoded = decodeCursor(String(cursor));
      if (!decoded) {
        return res.status(400).json({ success: false, message: 'Invalid cursor parameter' });
      }
      conditions.push({
        OR: [
          { createdAt: { lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        ],
      });
    }

    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      conditions.push({
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { skills: { has: searchTerm } },
        ],
      });
    }

    const candidates = await prisma.candidate.findMany({
      where: { AND: conditions },
      include: { job: { select: { id: true, title: true, company: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = candidates.length > limit;
    const data = hasMore ? candidates.slice(0, limit) : candidates;
    const nextCursor = hasMore && data.length > 0 ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({ success: true, data, nextCursor, hasMore });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch candidates' });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: req.params.id, organizationId: req.user!.orgId },
      include: { job: { select: { id: true, title: true, company: true } } },
    });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, data: candidate });
  } catch (_error) {
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
    if (typeof job !== 'string' || !isUuid(job)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }
    const jobRecord = await prisma.job.findFirst({
      where: { id: job, organizationId: req.user!.orgId },
      select: { id: true },
    });
    if (!jobRecord) {
      return res.status(400).json({ success: false, message: 'Invalid job for this organization' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) {
      return res.status(400).json({ success: false, message: 'Phone must be a string of at most 30 characters' });
    }
    if (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some((skill) => !isText(skill, 50)))) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be an array of up to 30 strings, each at most 50 characters',
      });
    }
    if (
      experienceYears !== undefined &&
      (typeof experienceYears !== 'number' ||
        !Number.isInteger(experienceYears) ||
        experienceYears < 0 ||
        experienceYears > 80)
    ) {
      return res.status(400).json({ success: false, message: 'Experience years must be an integer between 0 and 80' });
    }
    if (resumeText !== undefined && (typeof resumeText !== 'string' || resumeText.length > 30000)) {
      return res.status(400).json({ success: false, message: 'Resume text must be a string of at most 30000 characters' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Notes must be a string of at most 5000 characters' });
    }
    if (stage !== undefined && (typeof stage !== 'string' || !ALLOWED_STAGES.includes(stage as CandidateStage))) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || '',
        skills: skills || [],
        experienceYears: experienceYears ?? 0,
        resumeText: resumeText || '',
        jobId: jobRecord.id,
        stage: (stage as CandidateStage | undefined) ?? 'APPLIED',
        notes: notes || '',
        organizationId: req.user!.orgId,
        createdById: req.user!.id,
      },
      include: { job: { select: { id: true, title: true, company: true } } },
    });

    return res.status(201).json({ success: true, data: candidate });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to create candidate' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const { name, email, phone, skills, experienceYears, resumeText, job, stage, notes } = req.body ?? {};
    if (name !== undefined && !isText(name, 100)) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string of at most 100 characters' });
    }
    if (email !== undefined && (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim()))) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address (maximum 254 characters)' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) {
      return res.status(400).json({ success: false, message: 'Phone must be a string of at most 30 characters' });
    }
    if (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some((skill) => !isText(skill, 50)))) {
      return res.status(400).json({ success: false, message: 'Skills must be an array of up to 30 valid strings' });
    }
    if (
      experienceYears !== undefined &&
      (typeof experienceYears !== 'number' ||
        !Number.isInteger(experienceYears) ||
        experienceYears < 0 ||
        experienceYears > 80)
    ) {
      return res.status(400).json({ success: false, message: 'Experience years must be an integer between 0 and 80' });
    }
    if (resumeText !== undefined && (typeof resumeText !== 'string' || resumeText.length > 30000)) {
      return res.status(400).json({ success: false, message: 'Resume text must be a string of at most 30000 characters' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Notes must be a string of at most 5000 characters' });
    }
    if (stage !== undefined && (typeof stage !== 'string' || !ALLOWED_STAGES.includes(stage as CandidateStage))) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }
    if (job !== undefined) {
      if (typeof job !== 'string' || !isUuid(job)) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const jobRecord = await prisma.job.findFirst({
        where: { id: job, organizationId: req.user!.orgId },
        select: { id: true },
      });
      if (!jobRecord) {
        return res.status(400).json({ success: false, message: 'Invalid job for this organization' });
      }
    }

    const updates: Prisma.CandidateUncheckedUpdateInput = {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills }),
      ...(experienceYears !== undefined && { experienceYears }),
      ...(resumeText !== undefined && { resumeText }),
      ...(job !== undefined && { jobId: job }),
      ...(stage !== undefined && { stage }),
      ...(notes !== undefined && { notes }),
    };
    const result = await prisma.candidate.updateMany({
      where: { id: req.params.id, organizationId: req.user!.orgId },
      data: updates,
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const candidate = await prisma.candidate.findFirst({
      where: { id: req.params.id, organizationId: req.user!.orgId },
      include: { job: { select: { id: true, title: true, company: true } } },
    });
    return res.status(200).json({ success: true, data: candidate });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to update candidate' });
  }
};

export const updateStage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }
    const { stage } = req.body ?? {};
    if (typeof stage !== 'string' || !ALLOWED_STAGES.includes(stage as CandidateStage)) {
      return res.status(400).json({ success: false, message: 'A valid stage is required' });
    }

    const where = { id: req.params.id, organizationId: req.user!.orgId };
    const existing = await prisma.candidate.findFirst({ where });
    if (!existing) return res.status(404).json({ success: false, message: 'Candidate not found' });

    await prisma.candidate.updateMany({ where, data: { stage: stage as CandidateStage } });
    const candidate = await prisma.candidate.findFirst({
      where,
      include: { job: { select: { id: true, title: true, company: true } } },
    });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    if (stage === 'HIRED' && existing.stage !== 'HIRED') {
      candidateEventEmitter.emit(CANDIDATE_HIRED, {
        orgId: req.user!.orgId,
        candidateId: candidate.id,
      });
    }

    return res.status(200).json({ success: true, data: candidate });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to update candidate stage' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const result = await prisma.candidate.deleteMany({
      where: { id: req.params.id, organizationId: req.user!.orgId },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Candidate not found' });
    return res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: req.params.id, organizationId: req.user!.orgId, stage: 'HIRED' },
      select: { id: true },
    });
    if (!candidate) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const filePath = invoicePath(req.user!.orgId, candidate.id);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.download(filePath, `invoice-${candidate.id}.pdf`);
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
};
