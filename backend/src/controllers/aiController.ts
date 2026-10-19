import { Response } from 'express';
import mongoose from 'mongoose';
import { matchResumeToJob } from '../services/aiService';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { AuthRequest } from '../middleware/auth';

export const resumeMatch = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.orgId;
    let { jobDescription, resumeText, jobId, candidateId } = req.body ?? {};

    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(String(jobId))) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const jobDoc = await Job.findOne({ _id: jobId, orgId });
      if (!jobDoc) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      jobDescription = jobDoc.description;
    }

    if (candidateId) {
      if (!mongoose.Types.ObjectId.isValid(String(candidateId))) {
        return res.status(400).json({ success: false, message: 'Invalid candidate id' });
      }
      const candidateDoc = await Candidate.findOne({ _id: candidateId, orgId });
      if (!candidateDoc) {
        return res.status(404).json({ success: false, message: 'Candidate not found' });
      }
      resumeText = candidateDoc.resumeText;
    }

    if (!jobDescription || !resumeText) {
      return res.status(400).json({ success: false, message: 'Both jobDescription and resumeText are required' });
    }

    const result = await matchResumeToJob(jobDescription, resumeText);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'AI_API_KEY_MISSING') {
      return res.status(503).json({
        success: false,
        message:
          'The AI Resume Matcher is not configured yet. Add an AI_API_KEY to your backend/.env file to enable this feature.',
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to analyze resume. Please try again in a moment.' });
  }
};