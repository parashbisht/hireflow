import api from './api';
import type { Candidate, CandidateListResponse } from '../types/candidate';

interface GetCandidatesParams {
  search?: string;
  status?: string;
  jobId?: string;
  page?: number;
  limit?: number;
}

export const getCandidates = async (params: GetCandidatesParams = {}) => {
  const res = await api.get<CandidateListResponse>('/candidates', { params });
  return res.data;
};

export const getCandidateById = async (id: string) => {
  const res = await api.get<{ success: boolean; data: Candidate }>(`/candidates/${id}`);
  return res.data.data;
};

export interface CandidatePayload {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  appliedJob: string;
  status: string;
  notes: string;
}

export const createCandidate = async (payload: CandidatePayload) => {
  const res = await api.post<{ success: boolean; data: Candidate }>('/candidates', payload);
  return res.data.data;
};

export const updateCandidate = async (id: string, payload: Partial<CandidatePayload>) => {
  const res = await api.patch<{ success: boolean; data: Candidate }>(`/candidates/${id}`, payload);
  return res.data.data;
};

export const updateCandidateStatus = async (id: string, status: string) => {
  const res = await api.patch<{ success: boolean; data: Candidate }>(`/candidates/${id}/status`, { status });
  return res.data.data;
};

export const deleteCandidate = async (id: string) => {
  await api.delete(`/candidates/${id}`);
};