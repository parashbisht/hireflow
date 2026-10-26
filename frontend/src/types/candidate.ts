export type CandidateStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export interface CandidateJobSummary {
  id: string;
  title: string;
  company: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  job: CandidateJobSummary | string;
  stage: CandidateStage;
  notes: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateListResponse {
  data: Candidate[];
  nextCursor: string | null;
  hasMore: boolean;
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
