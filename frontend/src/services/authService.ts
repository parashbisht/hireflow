import api from './api';
import type { AuthResponse, OrganizationUser, UserRole } from '../types/auth';

interface OrganizationUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return res.data.data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data.data;
};

export const getOrganizationUsers = async () => {
  const res = await api.get<{ success: boolean; data: OrganizationUser[] }>('/auth/users');
  return res.data.data;
};

export const createOrganizationUser = async (user: OrganizationUserInput) => {
  const res = await api.post<{ success: boolean; data: OrganizationUser }>('/auth/users', user);
  return res.data.data;
};
