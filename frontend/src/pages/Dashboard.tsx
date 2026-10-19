import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BriefcaseBusiness, UsersRound, UserRoundCheck, UserPlus, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import { getDashboardStats } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

const JOB_COLORS = ['#6366f1', '#14b8a6', '#8b5cf6', '#f59e0b', '#10b981'];

const STAGE_BADGES: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  SCREENING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  INTERVIEW: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  OFFER: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  HIRED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

const StatCard = ({ label, value, icon: Icon, gradient, iconColor }: {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}) => (
  <div className={`group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br ${gradient} p-5 text-white shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10`}>
    <div className="absolute -right-5 -top-6 size-28 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-white/85">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      </div>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ${iconColor}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6" aria-label="Loading dashboard">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-28 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="h-80 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      ))}
    </div>
    <div className="h-64 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
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
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hiring overview</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email} <span className="mx-1 text-slate-300 dark:text-slate-700">/</span> {user?.role}</p>
        </div>
        <Link to="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
          View jobs <ArrowRight size={16} />
        </Link>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>
      ) : stats ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Jobs" value={stats.totalJobs} icon={BriefcaseBusiness} gradient="from-indigo-600 to-blue-500" iconColor="text-indigo-50" />
            <StatCard label="Open Jobs" value={stats.openJobs} icon={UserPlus} gradient="from-teal-600 to-cyan-500" iconColor="text-teal-50" />
            <StatCard label="Total Candidates" value={stats.totalCandidates} icon={UsersRound} gradient="from-violet-600 to-fuchsia-500" iconColor="text-violet-50" />
            <StatCard label="Hired" value={stats.hiredCount} icon={UserRoundCheck} gradient="from-emerald-600 to-green-500" iconColor="text-emerald-50" />
          </div>

          {hasNoData ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><BriefcaseBusiness size={22} /></span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Your hiring dashboard is ready</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add a job or candidate to start seeing your team&apos;s progress.</p>
              <Link to="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Create a job <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Candidates by Stage</h2>
                  {stats.candidatesByStage.length === 0 ? (
                    <p className="py-24 text-center text-sm text-slate-500 dark:text-slate-400">No candidate stage data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats.candidatesByStage} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-label)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, borderColor: 'var(--chart-grid)', background: 'var(--chart-surface)', color: 'var(--chart-text)' }} />
                        <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Top Jobs by Candidate Count</h2>
                  {stats.candidatesByJob.length === 0 ? (
                    <p className="py-24 text-center text-sm text-slate-500 dark:text-slate-400">No job application data yet.</p>
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
                        <Tooltip contentStyle={{ borderRadius: 12, borderColor: 'var(--chart-grid)', background: 'var(--chart-surface)', color: 'var(--chart-text)' }} />
                        <Legend wrapperStyle={{ color: 'var(--chart-label)', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </section>
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent candidates</h2>
                </div>
                {stats.recentCandidates.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">No recent candidates.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.recentCandidates.map((candidate, index) => (
                      <li key={`${candidate.name}-${candidate.createdAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{candidate.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{candidate.jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_BADGES[candidate.stage] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {candidate.stage}
                          </span>
                          <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={candidate.createdAt}>
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
