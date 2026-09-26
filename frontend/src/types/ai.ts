export interface ResumeMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  interviewQuestions: string[];
}

export interface ResumeMatchResponse {
  success: boolean;
  data: ResumeMatchResult;
}