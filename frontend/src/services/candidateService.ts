import api from './api';
import type { Candidate, CandidateListResponse, CandidatePayload, CandidateStage } from '../types/candidate';

interface GetCandidatesParams {
  search?: string;
  stage?: CandidateStage | '';
  job?: string;
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

export const createCandidate = async (payload: CandidatePayload) => {
  const res = await api.post<{ success: boolean; data: Candidate }>('/candidates', payload);
  return res.data.data;
};

export const updateCandidate = async (id: string, payload: Partial<CandidatePayload>) => {
  const res = await api.patch<{ success: boolean; data: Candidate }>(`/candidates/${id}`, payload);
  return res.data.data;
};

export const updateCandidateStage = async (id: string, stage: CandidateStage) => {
  const res = await api.patch<{ success: boolean; data: Candidate }>(`/candidates/${id}/stage`, { stage });
  return res.data.data;
};

export const deleteCandidate = async (id: string) => {
  await api.delete(`/candidates/${id}`);
};