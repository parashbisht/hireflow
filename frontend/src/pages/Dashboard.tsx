import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import { getDashboardStats } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#3b82f6', SCREENING: '#eab308', INTERVIEW: '#a855f7', SELECTED: '#22c55e', REJECTED: '#ef4444',
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
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

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-6">{user?.email} ({user?.role})</p>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Jobs" value={stats.totalJobs} />
            <StatCard label="Open Jobs" value={stats.openJobs} />
            <StatCard label="Total Candidates" value={stats.totalCandidates} />
            <StatCard label="In Interview" value={stats.interviewCount} />
            <StatCard label="Selected" value={stats.selectedCount} />
            <StatCard label="Rejected" value={stats.rejectedCount} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Candidates by Hiring Status</h2>
              {stats.candidatesByStatus.length === 0 ? (
                <p className="text-sm text-gray-400">No candidates yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.candidatesByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry: { name?: string | number; value?: number }) => `${entry.name}: ${entry.value}`}
                    >
                      {stats.candidatesByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Applications by Job</h2>
              {stats.applicationsByJob.length === 0 ? (
                <p className="text-sm text-gray-400">No applications yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.applicationsByJob}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jobTitle" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      ) : null}
    </MainLayout>
  );
};

export default Dashboard;