import { EventType, OpportunityFacts } from '../models/interaction.model';

export type CandidateNoteTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** "now" notes concern the current stage; "ahead" notes prepare the candidate for a later stage. */
export type CandidateNoteHorizon = 'now' | 'ahead';

/** Identifies what a note's action button should do once its behaviour is implemented (US-I13 to US-I15). */
export type CandidateNoteActionId =
  | 'send-cv'
  | 'send-follow-up'
  | 'suggest-interview-times'
  | 'confirm-interview-date'
  | 'add-to-calendar'
  | 'plan-assessment'
  | 'confirm-deal-breakers'
  | 'clarify-location'
  | 'clarify-compensation'
  | 'request-feedback'
  | 'prepare-screening-answers'
  | 'prepare-offer-targets';

export interface CandidateNoteAction {
  id: CandidateNoteActionId;
  label: string;
}

export interface CandidateNote {
  horizon: CandidateNoteHorizon;
  tone: CandidateNoteTone;
  title: string;
  detail: string;
  /** Present only when the note calls for the candidate to do something. */
  action?: CandidateNoteAction;
}

export interface CandidateNoteInput {
  stage: 'Contacted' | 'Qualified' | 'Interviewing' | 'Decision';
  signals: EventType[];
  facts: OpportunityFacts[];
  daysSinceLastEvent: number;
  now: Date;
  /** The thread was closed by a negative outcome (rejection, not interested, failed assessment). */
  unsuccessful: boolean;
}

const MAX_NOTES = 6;
const STALE_AFTER_DAYS = 7;

/** Lower rank is shown first, so blockers are never pushed out by informational notes when the cap applies. */
const TONE_RANK: Record<CandidateNoteTone, number> = { danger: 0, warning: 1, success: 2, info: 3, neutral: 4 };

/**
 * Builds the "Take note" items for a thread: blockers, things worth remembering for the current stage
 * and heads-ups for stages still to come, most severe first. Pure and deterministic so it stays easy to test.
 */
export function buildCandidateNotes(input: CandidateNoteInput): CandidateNote[] {
  const notes: CandidateNote[] = [];
  const has = (...types: EventType[]) => types.some(type => input.signals.includes(type));

  const interviewNote = buildInterviewNote(input, has);
  if (interviewNote) {
    notes.push(interviewNote);
  }

  if (input.stage === 'Decision') {
    notes.push(...buildDecisionNotes(input, has));
    return prioritise(notes);
  }

  if (input.daysSinceLastEvent > STALE_AFTER_DAYS) {
    notes.push({
      horizon: 'now',
      tone: 'warning',
      title: 'No movement',
      detail: `Nothing has happened for ${input.daysSinceLastEvent} days. A short follow-up keeps this opportunity alive.`,
      action: { id: 'send-follow-up', label: 'Send follow-up' }
    });
  }

  if (has(EventType.CV_REQUEST) && !has(EventType.CV_SUBMITTED)) {
    notes.push({ horizon: 'now', tone: 'warning', title: 'CV requested', detail: 'Send your latest CV tailored to this role.', action: { id: 'send-cv', label: 'Send CV' } });
  }

  if (has(EventType.JOB_SPEC_TO_BE_SENT) && !has(EventType.JOB_SPEC_ATTACHED, EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT)) {
    notes.push({ horizon: 'now', tone: 'info', title: 'Job spec promised', detail: 'Follow up if the spec has not arrived within a few days.', action: { id: 'send-follow-up', label: 'Send follow-up' } });
  }

  if (has(EventType.SCREENING_ASSESSMENT_REQUEST, EventType.SCREENING_ASSESSMENT_SCHEDULED) && !has(EventType.SCREENING_ASSESSMENT_COMPLETED, EventType.SCREENING_ASSESSMENT_PASSED)) {
    notes.push({ horizon: 'now', tone: 'warning', title: 'Assessment pending', detail: 'Plan a completion window and submit before the deadline.', action: { id: 'plan-assessment', label: 'Plan time' } });
  } else if (has(EventType.SCREENING_ASSESSMENT_COMPLETED) && !has(EventType.SCREENING_ASSESSMENT_PASSED)) {
    notes.push({ horizon: 'now', tone: 'info', title: 'Awaiting assessment result', detail: 'Ask for an update if you hear nothing within a few days.', action: { id: 'send-follow-up', label: 'Ask for update' } });
  }

  if (has(EventType.INTERVIEW_TIME_PROPOSED_REJECTED)) {
    notes.push({ horizon: 'now', tone: 'warning', title: 'Interview time rejected', detail: 'Offer two or three alternative slots.', action: { id: 'suggest-interview-times', label: 'Suggest times' } });
  }

  if (has(EventType.LOCATION_BOTTLENECK) && !has(EventType.LOCATION_NEEDS_MET)) {
    notes.push({ horizon: 'now', tone: 'warning', title: 'Location is blocking', detail: 'Ask whether remote or hybrid flexibility is possible before the next step.', action: { id: 'clarify-location', label: 'Clarify location' } });
  }

  if (has(EventType.COMPENSATION_BOTTLENECK) && !has(EventType.COMPENSATION_NEEDS_MET)) {
    notes.push({ horizon: 'now', tone: 'warning', title: 'Compensation not aligned', detail: 'Confirm a realistic range, then decide whether to continue or defer.', action: { id: 'clarify-compensation', label: 'Clarify range' } });
  }

  if (has(EventType.SCREENING_ASSESSMENT_FAILED) && !has(EventType.SCREENING_ASSESSMENT_PASSED)) {
    notes.push({ horizon: 'now', tone: 'danger', title: 'Screening not passed', detail: 'Ask for feedback and decide whether a re-test or another route is viable.', action: { id: 'request-feedback', label: 'Ask for feedback' } });
  }

  const dealBreakerCount = countUnique(input.facts.flatMap(fact => fact.dealBreakers));
  if (dealBreakerCount > 0) {
    notes.push({
      horizon: 'now',
      tone: 'warning',
      title: dealBreakerCount === 1 ? 'Deal breaker stated' : `${dealBreakerCount} deal breakers stated`,
      detail: 'Confirm these work for you before investing more time.',
      action: { id: 'confirm-deal-breakers', label: 'Confirm with recruiter' }
    });
  }

  const terms = statedTerms(input.facts);
  if (terms.length > 0) {
    notes.push({ horizon: 'now', tone: 'neutral', title: 'Stated terms', detail: terms.join(' · ') });
  }

  notes.push(...buildAheadNotes(input, has));

  return prioritise(notes);
}

function prioritise(notes: CandidateNote[]): CandidateNote[] {
  return [...notes].sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]).slice(0, MAX_NOTES);
}

function buildInterviewNote(input: CandidateNoteInput, has: (...types: EventType[]) => boolean): CandidateNote | null {
  const raw = input.facts.map(fact => fact.interviewDate?.trim()).find((value): value is string => !!value);

  if (raw) {
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      return { horizon: 'now', tone: 'neutral', title: 'Interview', detail: raw };
    }

    const date = new Date(parsed);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return date.getTime() >= input.now.getTime()
      ? { horizon: 'now', tone: 'success', title: 'Interview date', detail: `${label}. Prepare and confirm logistics.`, action: { id: 'add-to-calendar', label: 'Add to calendar' } }
      : { horizon: 'now', tone: 'danger', title: 'Interview date passed', detail: `${label}. Follow up for feedback or the next step.`, action: { id: 'request-feedback', label: 'Ask for feedback' } };
  }

  if (has(EventType.INTERVIEW_SCHEDULED) && !input.unsuccessful) {
    return { horizon: 'now', tone: 'warning', title: 'Interview scheduled', detail: 'No date was captured. Confirm it with the recruiter.', action: { id: 'confirm-interview-date', label: 'Confirm date' } };
  }

  return null;
}

function buildDecisionNotes(input: CandidateNoteInput, has: (...types: EventType[]) => boolean): CandidateNote[] {
  if (has(EventType.NOT_INTERESTED)) {
    return [{ horizon: 'ahead', tone: 'neutral', title: 'Door still open', detail: 'You can re-engage if your circumstances change.' }];
  }

  return [{ horizon: 'ahead', tone: 'info', title: 'Ask for feedback', detail: 'Feedback helps with future applications and may keep the relationship warm.', action: { id: 'request-feedback', label: 'Request feedback' } }];
}

function buildAheadNotes(input: CandidateNoteInput, has: (...types: EventType[]) => boolean): CandidateNote[] {
  switch (input.stage) {
    case 'Contacted':
      return [{ horizon: 'ahead', tone: 'neutral', title: 'Screening next', detail: 'Have your salary range, notice period and location preference ready.', action: { id: 'prepare-screening-answers', label: 'Prepare answers' } }];
    case 'Qualified':
      return [{
        horizon: 'ahead',
        tone: 'neutral',
        title: 'Interviews likely next',
        detail: has(EventType.AVAILABILITY_INQUIRY) ? 'Keep your calendar flexible for the next two weeks.' : 'Keep your availability ready to share quickly.'
      }];
    case 'Interviewing':
      return [{ horizon: 'ahead', tone: 'neutral', title: 'If an offer follows', detail: 'Know your target compensation and how soon you can start.', action: { id: 'prepare-offer-targets', label: 'Set my targets' } }];
    default:
      return [];
  }
}

function statedTerms(facts: OpportunityFacts[]): string[] {
  const first = (pick: (fact: OpportunityFacts) => string | undefined) =>
    facts.map(pick).map(value => value?.trim()).find((value): value is string => !!value);

  const salary = first(fact => fact.salary);
  const notice = first(fact => fact.noticePeriod);
  const mode = first(fact => fact.workMode);
  const location = first(fact => fact.location);

  return [
    salary ? `Salary ${salary}` : '',
    mode && location ? `${mode}, ${location}` : mode ?? location ?? '',
    notice ? `Notice ${notice}` : ''
  ].filter(Boolean);
}

function countUnique(values: string[]): number {
  return new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean)).size;
}
