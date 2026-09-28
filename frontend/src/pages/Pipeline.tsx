import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
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
import { getCandidates, updateCandidateStage } from '../services/candidateService';
import { useToast } from '../components/Toast';
import { getJobs } from '../services/jobService';
import type { Candidate, CandidateStage } from '../types/candidate';
import type { Job } from '../types/job';

const STAGES: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const PAGE_LIMIT = 50;

const STAGE_STYLES: Record<CandidateStage, { accent: string; header: string }> = {
  APPLIED: { accent: 'border-blue-500', header: 'bg-blue-50 text-blue-800' },
  SCREENING: { accent: 'border-amber-500', header: 'bg-amber-50 text-amber-800' },
  INTERVIEW: { accent: 'border-violet-500', header: 'bg-violet-50 text-violet-800' },
  OFFER: { accent: 'border-indigo-500', header: 'bg-indigo-50 text-indigo-800' },
  HIRED: { accent: 'border-green-500', header: 'bg-green-50 text-green-800' },
  REJECTED: { accent: 'border-red-500', header: 'bg-red-50 text-red-800' },
};

const getJobTitle = (candidate: Candidate) =>
  candidate.job && typeof candidate.job === 'object' ? candidate.job.title : 'Unknown job';

const CandidateCardContent = ({ candidate, overlay = false }: { candidate: Candidate; overlay?: boolean }) => (
  <article className={`w-full rounded-md border border-gray-200 bg-white p-3 shadow-sm ${overlay ? 'shadow-lg ring-2 ring-blue-500' : ''}`}>
    <h3 className="font-medium text-sm text-gray-900">{candidate.name}</h3>
    <p className="mt-1 text-xs text-gray-500">{getJobTitle(candidate)}</p>
    {(candidate.skills?.length ?? 0) > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(candidate.skills ?? []).slice(0, 3).map((skill) => (
          <span key={skill} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{skill}</span>
        ))}
      </div>
    )}
  </article>
);

const DraggableCandidateCard = ({ candidate, disabled }: { candidate: Candidate; disabled: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate._id,
    disabled,
  });
  const style: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1 }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-pan-y active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <CandidateCardContent candidate={candidate} />
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

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[280px] shrink-0 flex-col overflow-hidden rounded-md border border-gray-200 border-t-4 bg-gray-50 ${stageStyle.accent} ${isOver ? 'bg-blue-50/60' : ''}`}
    >
      <header className={`flex items-center justify-between px-3 py-2.5 text-sm font-semibold ${stageStyle.header}`}>
        <h2>{stage}</h2>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{candidates.length}</span>
      </header>
      <div className="flex min-h-36 flex-1 flex-col gap-2.5 p-2.5">
        {candidates.length === 0 ? (
          <p className="py-5 text-center text-xs text-gray-400">No candidates</p>
        ) : (
          candidates.map((candidate) => (
            <DraggableCandidateCard key={candidate._id} candidate={candidate} disabled={isUpdating} />
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    getJobs({ limit: PAGE_LIMIT })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, []);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setActionError('');
    try {
      const firstPage = await getCandidates({ job: jobFilter, page: 1, limit: PAGE_LIMIT });
      const allCandidates = [...firstPage.data];
      for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
        const result = await getCandidates({ job: jobFilter, page, limit: PAGE_LIMIT });
        allCandidates.push(...result.data);
      }
      setCandidates(allCandidates);
    } catch {
      setError('Could not load the pipeline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [jobFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCandidateId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCandidateId(null);
    const { active, over } = event;
    if (!over) return;

    const candidateId = String(active.id);
    const targetStage = String(over.id).replace('stage:', '') as CandidateStage;
    const candidate = candidates.find((item) => item._id === candidateId);
    if (!candidate || !STAGES.includes(targetStage) || candidate.stage === targetStage) return;

    const previousStage = candidate.stage;
    setActionError('');
    setUpdatingId(candidateId);
    setCandidates((current) => current.map((item) =>
      item._id === candidateId ? { ...item, stage: targetStage } : item
    ));

    try {
      const updatedCandidate = await updateCandidateStage(candidateId, targetStage);
      setCandidates((current) => current.map((item) =>
        item._id === candidateId ? { ...item, stage: updatedCandidate.stage } : item
      ));
      showToast('success', `${candidate.name} moved to ${targetStage}.`);
    } catch {
      setCandidates((current) => current.map((item) =>
        item._id === candidateId ? { ...item, stage: previousStage } : item
      ));
      setActionError('Could not update the candidate stage. The candidate was moved back.');
      showToast('error', 'Could not update the candidate stage. The candidate was moved back.');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCandidate = candidates.find((candidate) => candidate._id === activeCandidateId);

  return (
    <MainLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Hiring Pipeline</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Job</span>
          <select
            value={jobFilter}
            onChange={(event) => setJobFilter(event.target.value)}
            className="min-w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All jobs</option>
            {jobs.map((job) => <option key={job._id} value={job._id}>{job.title} @ {job.company}</option>)}
          </select>
        </label>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading pipeline...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveCandidateId(null)}
        >
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max gap-3">
              {STAGES.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  candidates={candidates.filter((candidate) => candidate.stage === stage)}
                  isUpdating={updatingId !== null}
                />
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