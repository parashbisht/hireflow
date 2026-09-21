import api from './api';
import type { Job, JobListResponse } from '../types/job';

interface GetJobsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const getJobs = async (params: GetJobsParams = {}) => {
  const res = await api.get<JobListResponse>('/jobs', { params });
  return res.data;
};

export const getJobById = async (id: string) => {
  const res = await api.get<{ success: boolean; data: Job }>(`/jobs/${id}`);
  return res.data.data;
};

export interface JobPayload {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  requiredSkills: string[];
  experience: string;
  salaryRange: string;
  status: string;
}

export const createJob = async (payload: JobPayload) => {
  const res = await api.post<{ success: boolean; data: Job }>('/jobs', payload);
  return res.data.data;
};

export const updateJob = async (id: string, payload: Partial<JobPayload>) => {
  const res = await api.patch<{ success: boolean; data: Job }>(`/jobs/${id}`, payload);
  return res.data.data;
};

export const deleteJob = async (id: string) => {
  await api.delete(`/jobs/${id}`);
};