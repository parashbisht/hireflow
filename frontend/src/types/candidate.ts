export type CandidateStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface CandidateJobSummary {
  _id: string;
  title: string;
  company: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  job: CandidateJobSummary | string;
  stage: CandidateStage;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateListResponse {
  success: boolean;
  data: Candidate[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface CandidatePayload {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  job: string;
  stage: CandidateStage;
  notes: string;
}