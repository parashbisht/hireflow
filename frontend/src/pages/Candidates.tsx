import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import MainLayout from '../layouts/MainLayout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate, downloadInvoice } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import { useAuth } from '../hooks/useAuth';
import type { Candidate, CandidateStage } from '../types/candidate';
import type { Job } from '../types/job';

const STAGES: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const PAGE_LIMIT = 10;

const STAGE_COLORS: Record<CandidateStage, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW: 'bg-purple-100 text-purple-700',
  OFFER: 'bg-indigo-100 text-indigo-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  skills: '',
  experienceYears: 0,
  resumeText: '',
  job: '',
  stage: 'APPLIED' as CandidateStage,
  notes: '',
};

const jobLabel = (job: Candidate['job']) => {
  if (!job || typeof job !== 'object') return 'Unknown job';
  return `${job.title} @ ${job.company}`;
};

const InvoiceButton = ({ candidateId }: { candidateId: string }) => {
  const showToast = useToast();

  const handleDownloadInvoice = async () => {
    try {
      await downloadInvoice(candidateId);
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      showToast('error', status === 404
        ? 'Invoice is still being generated, try again in a moment.'
        : 'Failed to download invoice. Please try again.');
    }
  };

  return (
    <button type="button" onClick={handleDownloadInvoice} className="text-emerald-700 hover:underline">
      Invoice
    </button>
  );
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<CandidateStage | ''>('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const showToast = useToast();
  const { isAdmin, isRecruiter } = useAuth();
  const requestVersionRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    getJobs({ limit: 50 })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current;
    let active = true;

    getCandidates({ search, job: jobFilter, stage: stageFilter, limit: PAGE_LIMIT })
      .then((res) => {
        if (!active || requestVersion !== requestVersionRef.current) return;
        setCandidates(res.data);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch(() => {
        if (active && requestVersion === requestVersionRef.current) {
          setError('Could not load candidates. Please try again.');
        }
      })
      .finally(() => {
        if (active && requestVersion === requestVersionRef.current) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, jobFilter, stageFilter, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    const requestVersion = requestVersionRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const res = await getCandidates({
        search,
        job: jobFilter,
        stage: stageFilter,
        cursor: nextCursor,
        limit: PAGE_LIMIT,
      });
      if (requestVersion !== requestVersionRef.current) return;

      setCandidates((current) => {
        const existingIds = new Set(current.map((candidate) => candidate._id));
        return [...current, ...res.data.filter((candidate) => !existingIds.has(candidate._id))];
      });
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      if (requestVersion === requestVersionRef.current) {
        setError('Could not load more candidates. Please try again.');
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [nextCursor, search, jobFilter, stageFilter]);

  const resetCandidates = () => {
    requestVersionRef.current += 1;
    loadingMoreRef.current = false;
    setCandidates([]);
    setNextCursor(null);
    setHasMore(false);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError('');
  };

  const openCreateModal = () => {
    setEditingCandidate(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setForm({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills.join(', '),
      experienceYears: candidate.experienceYears,
      resumeText: candidate.resumeText,
      job: typeof candidate.job === 'string' ? candidate.job : candidate.job?._id ?? '',
      stage: candidate.stage,
      notes: candidate.notes,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      ...form,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    };

    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate._id, payload);
        showToast('success', 'Candidate updated successfully.');
      } else {
        await createCandidate(payload);
        showToast('success', 'Candidate added successfully.');
      }
      setIsModalOpen(false);
      resetCandidates();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const errorMessage = message || 'Failed to save candidate. Please check the fields and try again.';
      setFormError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCandidate(candidateToDelete._id);
      showToast('success', 'Candidate deleted successfully.');
      setCandidateToDelete(null);
      resetCandidates();
      setRefreshKey((current) => current + 1);
    } catch {
      showToast('error', 'Failed to delete candidate. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + Add Candidate
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email or skill..."
          value={search}
          onChange={(event) => {
            resetCandidates();
            setSearch(event.target.value);
          }}
          className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={jobFilter}
          onChange={(event) => {
            resetCandidates();
            setJobFilter(event.target.value);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All jobs</option>
          {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} @ {job.company}</option>)}
        </select>
        <select
          value={stageFilter}
          onChange={(event) => {
            resetCandidates();
            setStageFilter(event.target.value as CandidateStage | '');
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All stages</option>
          {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <p className="p-6 text-gray-500 text-sm">Loading candidates...</p>
        ) : error ? (
          <p className="p-6 text-red-600 text-sm">{error}</p>
        ) : candidates.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">No candidates found. Click "Add Candidate" to create one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Skills</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{candidate.name}</td>
                  <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                  <td className="px-4 py-3 text-gray-600">{jobLabel(candidate.job)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[candidate.stage]}`}>
                      {candidate.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{candidate.skills.slice(0, 3).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {candidate.stage === 'HIRED' && (isAdmin || isRecruiter) && <InvoiceButton candidateId={candidate._id} />}
                    <button onClick={() => openEditModal(candidate)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => setCandidateToDelete(candidate)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !error && hasMore && (
        <div className="mt-4 flex justify-center">
          <button onClick={loadMore} disabled={isLoadingMore} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50">
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}>
        {formError && <p className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
              <select required value={form.job} onChange={(event) => setForm({ ...form, job: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a job...</option>
                {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} @ {job.company}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as CandidateStage })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input type="number" min="0" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="React, Node.js, MongoDB" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume Text</label>
            <textarea rows={3} value={form.resumeText} onChange={(event) => setForm({ ...form, resumeText: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingCandidate ? 'Save Changes' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={candidateToDelete !== null}
        title="Delete candidate"
        message={candidateToDelete ? `Delete "${candidateToDelete.name}"? This cannot be undone.` : ''}
        isConfirming={isDeleting}
        onCancel={() => setCandidateToDelete(null)}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
};

export default Candidates;