import { CandidateStage } from '@prisma/client';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.orgId;
    const [
      totalJobs,
      openJobs,
      totalCandidates,
      hiredCount,
      stageCounts,
      jobCounts,
      recentCandidates,
    ] = await Promise.all([
      prisma.job.count({ where: { organizationId } }),
      prisma.job.count({ where: { organizationId, status: 'OPEN' } }),
      prisma.candidate.count({ where: { organizationId } }),
      prisma.candidate.count({ where: { organizationId, stage: 'HIRED' } }),
      prisma.candidate.groupBy({
        by: ['stage'],
        where: { organizationId },
        _count: { _all: true },
        orderBy: { stage: 'asc' },
      }),
      prisma.candidate.groupBy({
        by: ['jobId'],
        where: { organizationId },
        _count: { _all: true },
        orderBy: { _count: { jobId: 'desc' } },
        take: 5,
      }),
      prisma.candidate.findMany({
        where: { organizationId },
        include: { job: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const jobs = await prisma.job.findMany({
      where: { id: { in: jobCounts.map(({ jobId }) => jobId) } },
      select: { id: true, title: true },
    });
    const jobTitles = new Map(jobs.map((job) => [job.id, job.title]));
    const candidatesByStage = stageCounts.map(({ stage, _count }) => ({
      stage: stage as CandidateStage,
      count: _count._all,
    }));
    const candidatesByJob = jobCounts.map(({ jobId, _count }) => ({
      jobTitle: jobTitles.get(jobId) ?? 'Unknown job',
      count: _count._all,
    }));
    const recent = recentCandidates.map(({ name, job, stage, createdAt }) => ({
      name,
      jobTitle: job.title,
      stage,
      createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        totalCandidates,
        hiredCount,
        candidatesByStage,
        candidatesByJob,
        recentCandidates: recent,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
