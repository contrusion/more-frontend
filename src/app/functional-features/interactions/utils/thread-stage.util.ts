import { EventType, InteractionThread } from '../models/interaction.model';

export type CandidateStage = 'Contacted' | 'Qualified' | 'Interviewing' | 'Decision';

const DECISION_SIGNALS: readonly EventType[] = [
  EventType.NOT_INTERESTED,
  EventType.REJECTION,
  EventType.SCREENING_ASSESSMENT_FAILED
];

const INTERVIEWING_SIGNALS: readonly EventType[] = [
  EventType.INTERVIEW_SCHEDULED,
  EventType.INTERVIEW_INVITE,
  EventType.INTERVIEW_TIME_ACCEPTED,
  EventType.INTERVIEW_TIME_PROPOSED,
  EventType.INTERVIEW_TIME_PROPOSED_REJECTED
];

const QUALIFIED_SIGNALS: readonly EventType[] = [
  EventType.CV_REQUEST,
  EventType.CV_SUBMITTED,
  EventType.JOB_SPEC_REQUEST,
  EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT,
  EventType.JOB_SPEC_ATTACHED,
  EventType.JOB_SPEC_REVIEWED,
  EventType.SCREENING_ASSESSMENT_REQUEST,
  EventType.SCREENING_ASSESSMENT_SCHEDULED,
  EventType.SCREENING_ASSESSMENT_COMPLETED,
  EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT,
  EventType.COMPENSATION_INQUIRY,
  EventType.COMPENSATION_NEEDS_MET,
  EventType.LOCATION_INQUIRY,
  EventType.LOCATION_NEEDS_MET,
  EventType.SKILLS_INQUIRY,
  EventType.VISA_INQUIRY,
  EventType.NOTICE_PERIOD_INQUIRY,
  EventType.AVAILABILITY_INQUIRY,
  EventType.BENEFITS_INQUIRY,
  EventType.INTERESTED,
  EventType.INTEREST_CHECK
];

/** Every distinct primary and additional signal across the thread's events, in first-seen order. */
export function getThreadSignalSet(thread: InteractionThread): EventType[] {
  const orderedSignals: EventType[] = [];

  thread.events.forEach(event => {
    if (!orderedSignals.includes(event.eventType)) {
      orderedSignals.push(event.eventType);
    }

    (event.additionalEventTypes ?? []).forEach((type: EventType) => {
      if (!orderedSignals.includes(type)) {
        orderedSignals.push(type);
      }
    });
  });

  return orderedSignals;
}

export function isUnsuccessfulDecision(signals: readonly EventType[]): boolean {
  return signals.some(type => DECISION_SIGNALS.includes(type));
}

/** Strongest terminal signal wins: Decision, then Interviewing, then Qualified, else Contacted. */
export function resolveCandidateStage(signals: readonly EventType[]): CandidateStage {
  if (isUnsuccessfulDecision(signals)) {
    return 'Decision';
  }

  if (signals.some(type => INTERVIEWING_SIGNALS.includes(type))) {
    return 'Interviewing';
  }

  if (signals.some(type => QUALIFIED_SIGNALS.includes(type))) {
    return 'Qualified';
  }

  return 'Contacted';
}
