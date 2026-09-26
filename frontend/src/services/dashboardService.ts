import api from './api';
import type { DashboardStatsResponse } from '../types/dashboard';

export const getDashboardStats = async () => {
  const res = await api.get<DashboardStatsResponse>('/dashboard/stats');
  return res.data.data;
};