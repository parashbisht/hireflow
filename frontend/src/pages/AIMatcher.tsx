import { useState } from 'react';
import type { FormEvent } from 'react';
import MainLayout from '../layouts/MainLayout';
import { matchResume } from '../services/aiMatcherService';
import type { ResumeMatchResult } from '../types/ai';

const AIMatcher = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState<ResumeMatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const runMatch = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await matchResume(jobDescription, resumeText);
      setResult(data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Something went wrong while analyzing the resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Please provide both a job description and resume text.');
      return;
    }
    await runMatch();
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Resume Matcher</h1>
      <p className="text-gray-500 mb-6">Paste a job description and a candidate's resume text to see how well they match.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea
            rows={10}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Looking for a React developer with JavaScript, React, Node.js, REST API and MongoDB experience."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Resume Text</label>
          <textarea
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Built React applications using JavaScript, Node.js and PostgreSQL."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? 'Analyzing...' : 'Analyze Match'}
        </button>
      </form>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={runMatch} className="ml-4 shrink-0 text-red-700 font-medium underline hover:no-underline">Retry</button>
        </div>
      )}

      {!error && !result && !isLoading && (
        <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Fill in both fields above and click "Analyze Match" to see results here.
        </div>
      )}

      {isLoading && (
        <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Analyzing resume against job description...
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Match Score</h2>
              <span className="text-2xl font-bold text-blue-600">{result.matchScore}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, result.matchScore))}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Matched Skills</h2>
              {result.matchedSkills.length === 0 ? (
                <p className="text-sm text-gray-400">None found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{skill}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Missing Skills</h2>
              {result.missingSkills.length === 0 ? (
                <p className="text-sm text-gray-400">None — great match!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Strengths</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {result.strengths.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Suggested Improvements</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {result.improvements.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Suggested Interview Questions</h2>
            <ul className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              {result.interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AIMatcher;