import { Response } from 'express';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalJobs, openJobs, totalCandidates, hiredCount, candidatesByStage, candidatesByJob, recentCandidates] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'OPEN' }),
      Candidate.countDocuments(),
      Candidate.countDocuments({ stage: 'HIRED' }),
      Candidate.aggregate<{ stage: string; count: number }>([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $project: { _id: 0, stage: '$_id', count: 1 } },
        { $sort: { stage: 1 } },
      ]),
      Candidate.aggregate<{ jobTitle: string; count: number }>([
        { $group: { _id: '$job', count: { $sum: 1 } } },
        { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
        { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, jobTitle: { $ifNull: ['$job.title', 'Unknown job'] }, count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Candidate.aggregate<{ name: string; jobTitle: string; stage: string; createdAt: Date }>([
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
        { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            name: 1,
            jobTitle: { $ifNull: ['$job.title', 'Unknown job'] },
            stage: 1,
            createdAt: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        totalCandidates,
        hiredCount,
        candidatesByStage,
        candidatesByJob,
        recentCandidates,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};