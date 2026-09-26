export interface CandidatesByStatusEntry {
  status: string;
  count: number;
}

export interface ApplicationsByJobEntry {
  jobTitle: string;
  count: number;
}

export interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  interviewCount: number;
  selectedCount: number;
  rejectedCount: number;
  candidatesByStatus: CandidatesByStatusEntry[];
  applicationsByJob: ApplicationsByJobEntry[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}