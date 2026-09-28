export interface DashboardStageCount {
  stage: string;
  count: number;
}

export interface DashboardJobCount {
  jobTitle: string;
  count: number;
}

export interface RecentCandidate {
  name: string;
  jobTitle: string;
  stage: string;
  createdAt: string;
}

export interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  hiredCount: number;
  candidatesByStage: DashboardStageCount[];
  candidatesByJob: DashboardJobCount[];
  recentCandidates: RecentCandidate[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}