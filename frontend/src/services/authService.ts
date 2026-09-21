import api from './api';
import type { AuthResponse } from '../types/auth';

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return res.data.data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};