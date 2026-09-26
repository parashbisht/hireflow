import { Response } from 'express';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalJobs, openJobs, totalCandidates, interviewCount, selectedCount, rejectedCount] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'OPEN' }),
      Candidate.countDocuments(),
      Candidate.countDocuments({ status: 'INTERVIEW' }),
      Candidate.countDocuments({ status: 'SELECTED' }),
      Candidate.countDocuments({ status: 'REJECTED' }),
    ]);

    const candidatesByStatusRaw = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const candidatesByStatus = candidatesByStatusRaw.map((row) => ({
      status: row._id as string,
      count: row.count as number,
    }));

    const applicationsByJobRaw = await Candidate.aggregate([
      { $group: { _id: '$appliedJob', count: { $sum: 1 } } },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const applicationsByJob = applicationsByJobRaw.map((row) => ({
      jobTitle: row.job ? row.job.title : 'Unknown job',
      count: row.count as number,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalJobs, openJobs, totalCandidates, interviewCount, selectedCount, rejectedCount,
        candidatesByStatus, applicationsByJob,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};