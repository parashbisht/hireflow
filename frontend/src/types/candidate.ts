export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';

export interface AppliedJobSummary {
  _id: string;
  title: string;
  company: string;
}

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  appliedJob: AppliedJobSummary | string;
  status: CandidateStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateListResponse {
  success: boolean;
  data: Candidate[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}