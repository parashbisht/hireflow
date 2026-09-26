import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import MainLayout from '../layouts/MainLayout';
import Modal from '../components/Modal';
import { getCandidates, createCandidate, updateCandidate, deleteCandidate } from '../services/candidateService';
import { getJobs } from '../services/jobService';
import type { Candidate, CandidateStatus } from '../types/candidate';
import type { Job } from '../types/job';

const STATUSES: CandidateStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

const STATUS_COLORS: Record<CandidateStatus, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW: 'bg-purple-100 text-purple-700',
  SELECTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const emptyForm = {
  name: '', email: '', phone: '', location: '', skills: '', experience: '',
  resumeUrl: '', linkedinUrl: '', githubUrl: '', appliedJob: '',
  status: 'APPLIED' as CandidateStatus, notes: '',
};

const PAGE_LIMIT = 10;

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getJobs({ limit: 100 })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, []);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getCandidates({ search, status: statusFilter, jobId: jobFilter, page, limit: PAGE_LIMIT });
      setCandidates(res.data);
      setTotalPages(res.pagination.totalPages || 1);
    } catch {
      setError('Could not load candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, jobFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilterChange = (value: string) => { setStatusFilter(value); setPage(1); };
  const handleJobFilterChange = (value: string) => { setJobFilter(value); setPage(1); };

  const jobLabel = (job: Candidate['appliedJob']) => {
    if (typeof job === 'string') return 'Unknown job';
    return `${job.title} @ ${job.company}`;
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
      location: candidate.location,
      skills: candidate.skills.join(', '),
      experience: candidate.experience,
      resumeUrl: candidate.resumeUrl,
      linkedinUrl: candidate.linkedinUrl,
      githubUrl: candidate.githubUrl,
      appliedJob: typeof candidate.appliedJob === 'string' ? candidate.appliedJob : candidate.appliedJob._id,
      status: candidate.status,
      notes: candidate.notes,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.appliedJob) {
      setFormError('Please select the job this candidate applied for.');
      return;
    }

    setIsSubmitting(true);
    const payload = { ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) };

    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate._id, payload);
      } else {
        await createCandidate(payload);
      }
      setIsModalOpen(false);
      fetchCandidates();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setFormError(message || 'Failed to save candidate. Please check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (candidate: Candidate) => {
    const confirmed = window.confirm(`Delete "${candidate.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteCandidate(candidate._id);
      fetchCandidates();
    } catch {
      alert('Failed to delete candidate. Please try again.');
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
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={jobFilter} onChange={(e) => handleJobFilterChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All jobs</option>
          {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} @ {job.company}</option>)}
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
                <th className="px-4 py-3 font-medium">Applied Job</th>
                <th className="px-4 py-3 font-medium">Skills</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate._id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{candidate.name}</div>
                    <div className="text-gray-400 text-xs">{candidate.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{jobLabel(candidate.appliedJob)}</td>
                  <td className="px-4 py-3 text-gray-600">{candidate.skills.slice(0, 3).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{candidate.experience || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[candidate.status]}`}>{candidate.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(candidate)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(candidate)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !error && candidates.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="space-x-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCandidate ? 'Edit Candidate' : 'Add Candidate'}>
        {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applied Job</label>
            <select required value={form.appliedJob} onChange={(e) => setForm({ ...form, appliedJob: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a job...</option>
              {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} @ {job.company}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, MongoDB" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="2 years" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CandidateStatus })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
              <input type="text" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input type="text" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
            <input type="text" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingCandidate ? 'Save Changes' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};

export default Candidates;