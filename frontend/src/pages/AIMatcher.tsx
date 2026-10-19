import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { getJobs } from '../services/jobService';
import { matchResume } from '../services/aiMatcherService';
import type { Job } from '../types/job';
import type { ResumeMatchResult } from '../types/ai';

const AiMatcher = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ResumeMatchResult | null>(null);
  const [aiConfigError, setAiConfigError] = useState<string | null>(null);

  const showToast = useToast();
  const { isViewer } = useAuth();

  useEffect(() => {
    getJobs({ limit: 50 })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, []);

  const handleJobSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedJobId(id);
    if (id) {
      const selected = jobs.find((job) => job._id === id);
      if (selected) {
        setJobDescription(selected.description);
      }
    }
  };

  const handleReset = () => {
    setSelectedJobId('');
    setJobDescription('');
    setResumeText('');
    setResult(null);
    setAiConfigError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!jobDescription.trim() || !resumeText.trim()) {
      showToast('error', 'Please provide both a job description and resume text.');
      return;
    }

    setIsLoading(true);
    setAiConfigError(null);

    try {
      const matchResult = await matchResume(jobDescription.trim(), resumeText.trim());
      setResult(matchResult);
      showToast('success', 'Resume match analysis complete.');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || '';

      if (
        status === 503 ||
        message.includes('AI_API_KEY') ||
        message.toLowerCase().includes('not configured')
      ) {
        const configMsg = 'AI is not configured. Add AI_API_KEY in backend .env';
        setAiConfigError(configMsg);
        showToast('error', configMsg);
      } else {
        const errorMsg = message || 'Failed to analyze resume. Please try again.';
        showToast('error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreTheme = (score: number) => {
    if (score >= 75) {
      return {
        badge: 'text-green-700 bg-green-50 border-green-200',
        bar: 'bg-green-600',
        text: 'text-green-600',
        label: 'Strong Match',
      };
    }
    if (score >= 50) {
      return {
        badge: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        bar: 'bg-yellow-500',
        text: 'text-yellow-600',
        label: 'Moderate Match',
      };
    }
    return {
      badge: 'text-red-700 bg-red-50 border-red-200',
      bar: 'bg-red-500',
      text: 'text-red-600',
      label: 'Low Match',
    };
  };

  const scoreTheme = result ? getScoreTheme(result.matchScore) : null;

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Resume Matcher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare candidate resumes against job descriptions to assess skill overlap, strengths, and interview questions.
        </p>
      </div>

      {aiConfigError && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{aiConfigError}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <label htmlFor="job-select" className="mb-1 block text-sm font-medium text-gray-700">
            Select Existing Job Opening (Optional)
          </label>
          <select
            id="job-select"
            value={selectedJobId}
            onChange={handleJobSelect}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Choose a job to auto-fill description --</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} ({job.company})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="job-description" className="mb-1 block text-sm font-medium text-gray-700">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="job-description"
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here or select a job from above..."
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="resume-text" className="mb-1 block text-sm font-medium text-gray-700">
              Candidate Resume Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resume-text"
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text or CV summary here..."
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || isViewer}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing Match...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze Match
              </>
            )}
          </button>
          {isViewer && (
            <span className="text-xs text-amber-700 font-medium">
              Read-only mode (AI Matcher requires Recruiter or Admin role)
            </span>
          )}

          {(jobDescription || resumeText || result) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Analysis Results */}
      {result && scoreTheme && (
        <div className="space-y-6">
          {/* Match Score Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Match Overview</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Overall Match Score</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-4xl font-extrabold ${scoreTheme.text}`}>{result.matchScore}%</span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${scoreTheme.badge}`}>
                    {scoreTheme.label}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreTheme.bar}`}
                    style={{ width: `${Math.min(Math.max(result.matchScore, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Matched Skills ({result.matchedSkills.length})
              </h3>
              {result.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No matching skills identified.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Missing Skills ({result.missingSkills.length})
              </h3>
              {result.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No missing skills detected.</p>
              )}
            </div>
          </div>

          {/* Detailed Lists: Strengths & Improvements */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-gray-900">Key Strengths</h3>
              {result.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {result.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No specific strengths listed.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-gray-900">Areas for Improvement</h3>
              {result.improvements.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {result.improvements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No specific improvements noted.</p>
              )}
            </div>
          </div>

          {/* Interview Questions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Suggested Interview Questions</h3>
            {result.interviewQuestions.length > 0 ? (
              <ol className="list-inside list-decimal space-y-2.5 text-sm text-gray-700">
                {result.interviewQuestions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-gray-800">{q}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">No interview questions generated.</p>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AiMatcher;
