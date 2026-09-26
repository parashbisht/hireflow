import { env } from '../config/env';

export interface ResumeMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  interviewQuestions: string[];
}

const SYSTEM_PROMPT = `You are an ATS-style resume matching assistant.
Given a job description and a resume, compare them and respond with ONLY a raw JSON object
(no markdown, no code fences, no extra text) in exactly this shape:

{
  "matchScore": <number 0-100>,
  "matchedSkills": [<string>, ...],
  "missingSkills": [<string>, ...],
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "interviewQuestions": [<string>, ...]
}`;

export const matchResumeToJob = async (jobDescription: string, resumeText: string): Promise<ResumeMatchResult> => {
  if (!env.aiApiKey) {
    throw new Error('AI_API_KEY_MISSING');
  }

  const response = await fetch(`${env.aiApiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI_API_ERROR: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawContent: string = data?.choices?.[0]?.message?.content || '';

  const cleaned = rawContent.replace(/```json|```/g, '').trim();

  let parsed: ResumeMatchResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI_RESPONSE_PARSE_ERROR');
  }

  return {
    matchScore: Number(parsed.matchScore) || 0,
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : [],
  };
};