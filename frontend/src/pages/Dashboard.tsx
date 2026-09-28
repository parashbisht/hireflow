import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import { getDashboardStats } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

const JOB_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];

const STAGE_BADGES: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW: 'bg-purple-100 text-purple-700',
  OFFER: 'bg-indigo-100 text-indigo-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6" aria-label="Loading dashboard">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-24 rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="h-80 rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
    <div className="h-64 rounded-lg border border-gray-200 bg-gray-100" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch(() => setError('Could not load dashboard stats. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const hasNoData = stats !== null && stats.totalJobs === 0 && stats.totalCandidates === 0;

  return (
    <MainLayout>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
      <p className="mb-6 text-gray-500">{user?.email} ({user?.role})</p>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : stats ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Jobs" value={stats.totalJobs} />
            <StatCard label="Open Jobs" value={stats.openJobs} />
            <StatCard label="Total Candidates" value={stats.totalCandidates} />
            <StatCard label="Hired" value={stats.hiredCount} />
          </div>

          {hasNoData ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-gray-900">No dashboard data yet</h2>
              <p className="mt-2 text-sm text-gray-500">Jobs and candidates will appear here as your team adds them.</p>
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">Candidates by Stage</h2>
                  {stats.candidatesByStage.length === 0 ? (
                    <p className="py-24 text-center text-sm text-gray-400">No candidate stage data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats.candidatesByStage} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Candidates" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-5 shadow">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">Top Jobs by Candidate Count</h2>
                  {stats.candidatesByJob.length === 0 ? (
                    <p className="py-24 text-center text-sm text-gray-400">No job application data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={stats.candidatesByJob}
                          dataKey="count"
                          nameKey="jobTitle"
                          cx="50%"
                          cy="46%"
                          outerRadius={88}
                          label={(entry: { name?: string | number; value?: number }) => `${entry.name}: ${entry.value}`}
                        >
                          {stats.candidatesByJob.map((job, index) => (
                            <Cell key={job.jobTitle} fill={JOB_COLORS[index % JOB_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </section>
              </div>

              <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-700">Recent candidates</h2>
                </div>
                {stats.recentCandidates.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-400">No recent candidates.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {stats.recentCandidates.map((candidate, index) => (
                      <li key={`${candidate.name}-${candidate.createdAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{candidate.name}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{candidate.jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${STAGE_BADGES[candidate.stage] || 'bg-gray-100 text-gray-600'}`}>
                            {candidate.stage}
                          </span>
                          <time className="text-xs text-gray-500" dateTime={candidate.createdAt}>
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </MainLayout>
  );
};

export default Dashboard;