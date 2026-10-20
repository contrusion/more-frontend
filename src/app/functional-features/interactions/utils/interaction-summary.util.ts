import { InteractionStatus, InteractionThread } from '../models/interaction.model';
import { getThreadSignalSet, resolveCandidateStage } from './thread-stage.util';

export interface InteractionSummary {
  /** Threads still in play: not closed by the backend and not ended by a rejection or a "not interested". */
  activeInteractions: number;
  /** Active threads with a stated interview date that has not passed yet. */
  upcomingInterviews: number;
  /** Active threads still at first contact: the recruiter reached out and nothing has progressed yet. */
  newOpportunities: number;
  /** Distinct recruiters across all threads. */
  recruiters: number;
}

/**
 * Totals for the home page, derived from the user's interaction threads.
 *
 * The thread `status` from the backend is not used to decide what is active: synced threads stay NEW until
 * explicitly closed. The stage is inferred from the event signals instead, the same way the Interactions
 * accordion does, so a thread that reached "Closed" there is not counted here.
 */
export function summariseInteractions(threads: readonly InteractionThread[], now: Date = new Date()): InteractionSummary {
  const active = threads.filter(isActive);

  return {
    activeInteractions: active.length,
    upcomingInterviews: active.filter(thread => hasUpcomingInterview(thread, now)).length,
    newOpportunities: active.filter(thread => resolveCandidateStage(getThreadSignalSet(thread)) === 'Contacted').length,
    recruiters: new Set(threads.map(thread => thread.participantId)).size
  };
}

function isActive(thread: InteractionThread): boolean {
  return thread.status !== InteractionStatus.CLOSED
    && resolveCandidateStage(getThreadSignalSet(thread)) !== 'Decision';
}

function hasUpcomingInterview(thread: InteractionThread, now: Date): boolean {
  return (thread.opportunities ?? []).some(opportunity => {
    const raw = opportunity.facts.interviewDate?.trim();
    if (!raw) {
      return false;
    }

    const parsed = Date.parse(raw);
    return !Number.isNaN(parsed) && parsed >= now.getTime();
  });
}
