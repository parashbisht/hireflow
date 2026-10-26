import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { getJobs, createJob, updateJob, deleteJob } from '../services/jobService';
import type { Job, EmploymentType, JobStatus } from '../types/job';

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];

const emptyForm = {
  title: '',
  company: '',
  location: '',
  employmentType: 'FULL_TIME' as EmploymentType,
  description: '',
  requiredSkills: '',
  experience: '',
  salaryRange: '',
  status: 'OPEN' as JobStatus,
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const showToast = useToast();
  const { isViewer } = useAuth();

  const fetchJobs = useCallback(async () => {
    try {
      const res = await getJobs({ search, status: statusFilter, limit: 50 });
      setJobs(res.data);
    } catch {
      setError('Could not load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const openCreateModal = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      experience: job.experience,
      salaryRange: job.salaryRange,
      status: job.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      ...form,
      requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingJob) {
        await updateJob(editingJob.id, payload);
        showToast('success', 'Job updated successfully.');
      } else {
        await createJob(payload);
        showToast('success', 'Job created successfully.');
      }
      setIsModalOpen(false);
      setError('');
      setIsLoading(true);
      fetchJobs();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const errorMessage = message || 'Failed to save job. Please check the fields and try again.';
      setFormError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await deleteJob(jobToDelete.id);
      showToast('success', 'Job deleted successfully.');
      setJobToDelete(null);
      setError('');
      setIsLoading(true);
      fetchJobs();
    } catch {
      showToast('error', 'Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Open roles</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jobs</h1>
          {isViewer && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Read-only mode (Viewer)</p>}
        </div>
        {!isViewer && (
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950">
            <Plus size={17} /> Add job
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by title, company or skill..."
          value={search}
          onChange={(e) => {
            setError('');
            setIsLoading(true);
            setSearch(e.target.value);
          }}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setError('');
            setIsLoading(true);
            setStatusFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading jobs">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <p role="alert" className="p-6 text-sm text-rose-700 dark:text-rose-300">{error}</p>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><BriefcaseBusiness size={24} /></span>
            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No jobs yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">Create your first opening to start organizing applicants.</p>
            {!isViewer && <button onClick={openCreateModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"><Plus size={16} /> Create your first job</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {!isViewer && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{job.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.company}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.location}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.employmentType.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {job.status}
                    </span>
                  </td>
                  {!isViewer && (
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEditModal(job)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-300">Edit</button>
                      <button onClick={() => setJobToDelete(job)} className="font-medium text-rose-600 hover:underline dark:text-rose-300">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingJob ? 'Edit Job' : 'Add Job'}>
        {formError && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{formError}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Job Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Company</label>
              <input type="text" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Location</label>
              <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Employment Type</label>
              <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="React, Node.js, MongoDB" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Experience</label>
              <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="2-4 years" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Salary Range</label>
              <input type="text" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="₹6L - ₹10L" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingJob ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={jobToDelete !== null}
        title="Delete job"
        message={jobToDelete ? `Delete "${jobToDelete.title}" at ${jobToDelete.company}? This cannot be undone.` : ''}
        isConfirming={isDeleting}
        onCancel={() => setJobToDelete(null)}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
};

export default Jobs;
