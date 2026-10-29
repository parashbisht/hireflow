import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MouseEvent } from 'react';
import { CircleDashed, Loader2 } from 'lucide-react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import MainLayout from '../layouts/MainLayout';
import { downloadInvoice, getCandidates, updateCandidateStage } from '../services/candidateService';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { getJobs } from '../services/jobService';
import type { Candidate, CandidateStage } from '../types/candidate';
import type { Job } from '../types/job';

const STAGES: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STAGE_LABELS: Record<CandidateStage, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interviewing',
  OFFER: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};
const PAGE_LIMIT = 50;
const MAX_PIPELINE_CANDIDATES = 1000;

const STAGE_STYLES: Record<CandidateStage, { accent: string; header: string; count: string; cardAccent: string }> = {
  APPLIED: { accent: 'border-t-blue-500', header: 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200', count: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', cardAccent: 'border-l-blue-400' },
  SCREENING: { accent: 'border-t-amber-500', header: 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200', count: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', cardAccent: 'border-l-amber-400' },
  INTERVIEW: { accent: 'border-t-violet-500', header: 'bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200', count: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', cardAccent: 'border-l-violet-400' },
  OFFER: { accent: 'border-t-teal-500', header: 'bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200', count: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', cardAccent: 'border-l-teal-400' },
  HIRED: { accent: 'border-t-green-500', header: 'bg-green-50 text-green-900 dark:bg-green-950/60 dark:text-green-200', count: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', cardAccent: 'border-l-green-400' },
  REJECTED: { accent: 'border-t-red-500', header: 'bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200', count: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', cardAccent: 'border-l-red-400' },
};

const getJobTitle = (candidate: Candidate) =>
  candidate.job && typeof candidate.job === 'object' ? candidate.job.title : 'Unknown job';

const CandidateCardContent = ({ candidate, overlay = false }: { candidate: Candidate; overlay?: boolean }) => (
  <article className={`w-full rounded-xl border border-slate-200 border-l-4 ${STAGE_STYLES[candidate.stage].cardAccent} bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900 ${overlay ? 'shadow-lg ring-2 ring-indigo-500' : ''}`}>
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{candidate.name}</h3>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getJobTitle(candidate)}</p>
    {(candidate.skills?.length ?? 0) > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(candidate.skills ?? []).slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{skill}</span>
        ))}
      </div>
    )}
  </article>
);

const InvoiceButton = ({ candidateId }: { candidateId: string }) => {
  const showToast = useToast();
  const { isAdmin, isRecruiter, isViewer } = useAuth();
  const canDownloadInvoice = !isViewer && (isAdmin || isRecruiter);

  if (!canDownloadInvoice) {
    return null;
  }

  const handleDownloadInvoice = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await downloadInvoice(candidateId);
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 404) {
        showToast('error', 'Invoice is still being generated, try again in a moment.');
        return;
      }

      showToast('error', 'Failed to download invoice. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadInvoice}
      className="mt-2 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
    >
      Invoice
    </button>
  );
};

const DraggableCandidateCard = ({ candidate, disabled }: { candidate: Candidate; disabled: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    disabled,
  });
  const style: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1 }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-30' : ''}
    >
      <div {...listeners} {...attributes} className="cursor-grab touch-pan-y active:cursor-grabbing">
        <CandidateCardContent candidate={candidate} />
      </div>
      {candidate.stage === 'HIRED' && <InvoiceButton candidateId={candidate.id} />}
    </div>
  );
};

const StageColumn = ({ stage, candidates, isUpdating }: {
  stage: CandidateStage;
  candidates: Candidate[];
  isUpdating: boolean;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: `stage:${stage}` });
  const stageStyle = STAGE_STYLES[stage];
  const { isViewer } = useAuth();

  return (
    <section
      ref={setNodeRef}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 border-t-4 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${stageStyle.accent} ${isOver ? 'scale-[1.01] ring-2 ring-indigo-500 shadow-lg dark:ring-indigo-400' : ''} dark:border-slate-800 dark:bg-slate-900`}
    >
      <header className={`flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold ${stageStyle.header}`}>
        <h2 className="truncate">{STAGE_LABELS[stage]}</h2>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${stageStyle.count}`}>{candidates.length}</span>
      </header>
      <div className="flex min-h-36 flex-1 flex-col gap-3 bg-slate-50/70 p-3 dark:bg-slate-950/40">
        {candidates.length === 0 ? (
          <div className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center transition-colors ${isOver ? 'border-indigo-300 bg-indigo-50/70 text-indigo-500 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' : 'border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500'}`}>
            <CircleDashed size={18} aria-hidden="true" />
            <p className="mt-2 text-xs font-medium">{isViewer ? 'No candidates in this stage' : 'Drop a candidate here'}</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <DraggableCandidateCard key={candidate.id} candidate={candidate} disabled={isUpdating || isViewer} />
          ))
        )}
      </div>
    </section>
  );
};

const Pipeline = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobFilter, setJobFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const showToast = useToast();
  const { isViewer } = useAuth();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    getJobs({ limit: PAGE_LIMIT })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, []);

  const fetchCandidates = useCallback(async () => {
    try {
      const allCandidates: Candidate[] = [];
      let cursor: string | null = null;
      let hasMore = true;
      let hitCap = false;

      while (hasMore && allCandidates.length < MAX_PIPELINE_CANDIDATES) {
        const res = await getCandidates({ job: jobFilter, cursor: cursor ?? undefined, limit: PAGE_LIMIT });
        allCandidates.push(...res.data);
        cursor = res.nextCursor;
        hasMore = res.hasMore && allCandidates.length < MAX_PIPELINE_CANDIDATES;
        if (allCandidates.length >= MAX_PIPELINE_CANDIDATES) {
          hitCap = true;
          break;
        }
      }

      if (hitCap) {
        setError(`Pipeline capped at ${MAX_PIPELINE_CANDIDATES} candidates. Some results may not be shown.`);
      }

      setCandidates(allCandidates);
    } catch {
      setError('Could not load the pipeline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [jobFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCandidateId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCandidateId(null);
    const { active, over } = event;
    if (!over || isViewer) return;

    const candidateId = String(active.id);
    const targetStage = String(over.id).replace('stage:', '') as CandidateStage;
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate || !STAGES.includes(targetStage) || candidate.stage === targetStage) return;

    const previousStage = candidate.stage;
    setActionError('');
    setUpdatingId(candidateId);
    setCandidates((current) => current.map((item) =>
      item.id === candidateId ? { ...item, stage: targetStage } : item
    ));

    try {
      const updatedCandidate = await updateCandidateStage(candidateId, targetStage);
      setCandidates((current) => current.map((item) =>
        item.id === candidateId ? { ...item, stage: updatedCandidate.stage } : item
      ));
      showToast('success', `${candidate.name} moved to ${targetStage}.`);
    } catch {
      setCandidates((current) => current.map((item) =>
        item.id === candidateId ? { ...item, stage: previousStage } : item
      ));
      setActionError('Could not update the candidate stage. The candidate was moved back.');
      showToast('error', 'Could not update the candidate stage. The candidate was moved back.');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCandidate = candidates.find((candidate) => candidate.id === activeCandidateId);

  return (
    <MainLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Workflow</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hiring Pipeline</h1>
          {isViewer && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Read-only mode: drag-and-drop is disabled for viewer accounts</p>}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span>Job</span>
          <select
            value={jobFilter}
            onChange={(event) => {
              setError('');
              setActionError('');
              setIsLoading(true);
              setJobFilter(event.target.value);
            }}
            className="min-w-48 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All jobs</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} @ {job.company}</option>)}
          </select>
        </label>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 size={18} className="animate-spin text-indigo-600 dark:text-indigo-400" /> Loading pipeline...
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveCandidateId(null)}
        >
          <div
            className="pipeline-scroll overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            role="region"
            aria-label="Hiring stages. Scroll horizontally to view every stage."
            tabIndex={0}
          >
            <div className="flex min-w-max items-stretch gap-4">
              {STAGES.map((stage) => (
                <div key={stage} className="w-[280px] shrink-0">
                  <StageColumn
                    stage={stage}
                    candidates={candidates.filter((candidate) => candidate.stage === stage)}
                    isUpdating={updatingId !== null}
                  />
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>{activeCandidate && <CandidateCardContent candidate={activeCandidate} overlay />}</DragOverlay>
        </DndContext>
      )}
    </MainLayout>
  );
};

export default Pipeline;
