import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { Plus, UsersRound } from 'lucide-react';
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
  APPLIED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  SCREENING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  INTERVIEW: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  OFFER: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  HIRED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
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
    <button type="button" onClick={handleDownloadInvoice} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
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
        const existingIds = new Set(current.map((candidate) => candidate.id));
        return [...current, ...res.data.filter((candidate) => !existingIds.has(candidate.id))];
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
      job: typeof candidate.job === 'string' ? candidate.job : candidate.job?.id ?? '',
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
        await updateCandidate(editingCandidate.id, payload);
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
      await deleteCandidate(candidateToDelete.id);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Talent pool</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidates</h1>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
          <Plus size={17} /> Add candidate
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
          className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />
        <select
          value={jobFilter}
          onChange={(event) => {
            resetCandidates();
            setJobFilter(event.target.value);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All jobs</option>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} @ {job.company}</option>)}
        </select>
        <select
          value={stageFilter}
          onChange={(event) => {
            resetCandidates();
            setStageFilter(event.target.value as CandidateStage | '');
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All stages</option>
          {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading candidates">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <p role="alert" className="p-6 text-sm text-rose-700 dark:text-rose-300">{error}</p>
        ) : candidates.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><UsersRound size={24} /></span>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No candidates yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">Add your first candidate to start tracking their hiring journey.</p>
            <button onClick={openCreateModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"><Plus size={16} /> Add a candidate</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
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
                <tr key={candidate.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{candidate.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{candidate.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{jobLabel(candidate.job)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[candidate.stage]}`}>
                      {candidate.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{candidate.skills.slice(0, 3).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {candidate.stage === 'HIRED' && (isAdmin || isRecruiter) && <InvoiceButton candidateId={candidate.id} />}
                    <button onClick={() => openEditModal(candidate)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-300">Edit</button>
                    <button onClick={() => setCandidateToDelete(candidate)} className="font-medium text-rose-600 hover:underline dark:text-rose-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !error && hasMore && (
        <div className="mt-4 flex justify-center">
          <button onClick={loadMore} disabled={isLoadingMore} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}>
        {formError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{formError}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone</label>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Job</label>
              <select required value={form.job} onChange={(event) => setForm({ ...form, job: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="">Select a job...</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} @ {job.company}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Stage</label>
              <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as CandidateStage })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Experience (years)</label>
              <input type="number" min="0" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Skills (comma-separated)</label>
            <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="React, Node.js, MongoDB" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Resume Text</label>
            <textarea rows={3} value={form.resumeText} onChange={(event) => setForm({ ...form, resumeText: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
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