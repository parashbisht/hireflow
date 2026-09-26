import api from './api';
import type { ResumeMatchResponse, ResumeMatchResult } from '../types/ai';

export const matchResume = async (jobDescription: string, resumeText: string): Promise<ResumeMatchResult> => {
  const res = await api.post<ResumeMatchResponse>('/ai/resume-match', { jobDescription, resumeText });
  return res.data.data;
};