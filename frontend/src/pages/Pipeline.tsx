import { useState, useEffect, useCallback } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getCandidates, updateCandidateStatus } from '../services/candidateService';
import type { Candidate, CandidateStatus } from '../types/candidate';

const COLUMNS: CandidateStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

const COLUMN_LABELS: Record<CandidateStatus, string> = {
  APPLIED: 'Applied', SCREENING: 'Screening', INTERVIEW: 'Interview', SELECTED: 'Selected', REJECTED: 'Rejected',
};

const COLUMN_HEADER_COLORS: Record<CandidateStatus, string> = {
  APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
  SCREENING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  INTERVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  SELECTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const jobLabel = (job: Candidate['appliedJob']) => {
  if (typeof job === 'string') return 'Unknown job';
  return `${job.title} @ ${job.company}`;
};

const Pipeline = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getCandidates({ limit: 500 });
      setCandidates(res.data);
    } catch {
      setError('Could not load the pipeline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const handleStatusChange = async (candidate: Candidate, newStatus: CandidateStatus) => {
    setUpdatingId(candidate._id);
    setCandidates((prev) => prev.map((c) => (c._id === candidate._id ? { ...c, status: newStatus } : c)));
    try {
      await updateCandidateStatus(candidate._id, newStatus);
    } catch {
      setCandidates((prev) => prev.map((c) => (c._id === candidate._id ? { ...c, status: candidate.status } : c)));
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hiring Pipeline</h1>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading pipeline...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map((column) => {
            const columnCandidates = candidates.filter((c) => c.status === column);
            return (
              <div key={column} className="bg-gray-100 rounded-lg p-3 min-h-[200px]">
                <div className={`flex items-center justify-between px-3 py-2 rounded-md border mb-3 text-sm font-semibold ${COLUMN_HEADER_COLORS[column]}`}>
                  <span>{COLUMN_LABELS[column]}</span>
                  <span>{columnCandidates.length}</span>
                </div>

                <div className="space-y-3">
                  {columnCandidates.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1">No candidates</p>
                  ) : (
                    columnCandidates.map((candidate) => (
                      <div key={candidate._id} className="bg-white rounded-md shadow-sm border border-gray-200 p-3">
                        <p className="font-medium text-gray-900 text-sm">{candidate.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{jobLabel(candidate.appliedJob)}</p>
                        {candidate.skills.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{candidate.skills.slice(0, 3).join(', ')}</p>
                        )}
                        {candidate.experience && <p className="text-xs text-gray-400 mt-1">{candidate.experience}</p>}

                        <select
                          value={candidate.status}
                          disabled={updatingId === candidate._id}
                          onChange={(e) => handleStatusChange(candidate, e.target.value as CandidateStatus)}
                          className="mt-2 w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {COLUMNS.map((s) => (
                            <option key={s} value={s}>{COLUMN_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export default Pipeline;