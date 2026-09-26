import { Response } from 'express';
import { matchResumeToJob } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

export const resumeMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription, resumeText } = req.body;

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
        message: 'The AI Resume Matcher is not configured yet. Add an AI_API_KEY to your backend/.env file to enable this feature.',
      });
    }

    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume. Please try again in a moment.' });
  }
};