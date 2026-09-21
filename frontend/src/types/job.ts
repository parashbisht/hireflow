export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
export type JobStatus = 'OPEN' | 'CLOSED';

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requiredSkills: string[];
  experience: string;
  salaryRange: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobFormData {
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
  requiredSkills: string;
  experience: string;
  salaryRange: string;
  status: JobStatus;
}

export interface JobListResponse {
  success: boolean;
  data: Job[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}