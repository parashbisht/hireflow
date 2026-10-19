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
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
        bar: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Strong Match',
      };
    }
    if (score >= 50) {
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
        bar: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Moderate Match',
      };
    }
    return {
      badge: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
      bar: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-300',
      label: 'Low Match',
    };
  };

  const scoreTheme = result ? getScoreTheme(result.matchScore) : null;

  return (
    <MainLayout>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Talent insights</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Resume Matcher</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Compare candidate resumes against job descriptions to assess skill overlap, strengths, and interview questions.
        </p>
      </div>

      {aiConfigError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">{aiConfigError}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <label htmlFor="job-select" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Select Existing Job Opening (Optional)
          </label>
          <select
            id="job-select"
            value={selectedJobId}
            onChange={handleJobSelect}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            <label htmlFor="job-description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="job-description"
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here or select a job from above..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="resume-text" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Candidate Resume Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resume-text"
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text or CV summary here..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || isViewer}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Read-only mode (AI Matcher requires Recruiter or Admin role)
            </span>
          )}

          {(jobDescription || resumeText || result) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Match Overview</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Overall Match Score</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-4xl font-extrabold ${scoreTheme.text}`}>{result.matchScore}%</span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${scoreTheme.badge}`}>
                    {scoreTheme.label}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                Matched Skills ({result.matchedSkills.length})
              </h3>
              {result.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No matching skills identified.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                Missing Skills ({result.missingSkills.length})
              </h3>
              {result.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No missing skills detected.</p>
              )}
            </div>
          </div>

          {/* Detailed Lists: Strengths & Improvements */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Key Strengths</h3>
              {result.strengths.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {result.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No specific strengths listed.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Areas for Improvement</h3>
              {result.improvements.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {result.improvements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No specific improvements noted.</p>
              )}
            </div>
          </div>

          {/* Interview Questions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Suggested Interview Questions</h3>
            {result.interviewQuestions.length > 0 ? (
              <ol className="list-inside list-decimal space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                {result.interviewQuestions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-slate-800 dark:text-slate-200">{q}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No interview questions generated.</p>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AiMatcher;
