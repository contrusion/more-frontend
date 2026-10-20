import { EventType } from '../models/interaction.model';

export type ActivityTone = 'success' | 'info' | 'neutral' | 'warning' | 'danger';

export interface ActivityGroup {
  id: string;
  label: string;
  /** Semantic colour intent: how positive the status group is for the candidate. */
  tone: ActivityTone;
  eventTypes: readonly EventType[];
}

/**
 * Event types that mean the same thing to a candidate share one group.
 * Ordered by precedence: when several signals arrive together, the first matching group wins.
 */
export const ACTIVITY_GROUPS: readonly ActivityGroup[] = [
  {
    id: 'closed',
    label: 'Closed',
    tone: 'danger',
    eventTypes: [EventType.REJECTION, EventType.NOT_INTERESTED]
  },
  {
    id: 'attention',
    label: 'Needs attention',
    tone: 'warning',
    eventTypes: [
      EventType.COMPENSATION_BOTTLENECK,
      EventType.LOCATION_BOTTLENECK,
      EventType.SKILLS_GAP,
      EventType.SCREENING_ASSESSMENT_FAILED,
      EventType.INTERVIEW_TIME_PROPOSED_REJECTED
    ]
  },
  {
    id: 'interview',
    label: 'Interviews & Assessments',
    tone: 'success',
    eventTypes: [
      EventType.INTERVIEW_INVITE,
      EventType.INTERVIEW_TIME_PROPOSED,
      EventType.INTERVIEW_TIME_ACCEPTED,
      EventType.INTERVIEW_SCHEDULED,
      EventType.SCREENING_ASSESSMENT_REQUEST,
      EventType.SCREENING_ASSESSMENT_SCHEDULED,
      EventType.SCREENING_ASSESSMENT_COMPLETED,
      EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT
    ]
  },
  {
    id: 'on-track',
    label: 'On track',
    tone: 'success',
    eventTypes: [
      EventType.COMPENSATION_NEEDS_MET,
      EventType.LOCATION_NEEDS_MET,
      EventType.SCREENING_ASSESSMENT_PASSED,
      EventType.INTERESTED
    ]
  },
  {
    id: 'screening',
    label: 'Screening',
    tone: 'info',
    eventTypes: [
      EventType.INQUIRY,
      EventType.SKILLS_INQUIRY,
      EventType.COMPENSATION_INQUIRY,
      EventType.LOCATION_INQUIRY,
      EventType.VISA_INQUIRY,
      EventType.NOTICE_PERIOD_INQUIRY,
      EventType.AVAILABILITY_INQUIRY,
      EventType.BENEFITS_INQUIRY,
      EventType.CV_REQUEST,
      EventType.CV_SUBMITTED,
      EventType.JOB_SPEC_REQUEST,
      EventType.JOB_SPEC_TO_BE_SENT,
      EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT,
      EventType.JOB_SPEC_ATTACHED,
      EventType.JOB_SPEC_REVIEWED
    ]
  },
  {
    id: 'process-update',
    label: 'Process update',
    tone: 'neutral',
    eventTypes: [EventType.RECRUITEMENT_PROCESS_UPDATE]
  },
  {
    id: 'outreach',
    label: 'Outreach',
    tone: 'neutral',
    eventTypes: [
      EventType.OUTREACH,
      EventType.INTEREST_CHECK,
      EventType.REPLY,
      EventType.FOLLOW_UP,
      EventType.ACKNOWLEDGEMENT,
      EventType.PENDING_CLASSIFICATION,
      EventType.UNKNOWN
    ]
  }
];

/**
 * Visual order for the timeline rail: older activity states first, later states after the current one.
 * This is separate from precedence, which still uses ACTIVITY_GROUPS above.
 */
export const ACTIVITY_TIMELINE_ORDER: readonly ActivityGroup[] = [
  ACTIVITY_GROUPS[6],
  ACTIVITY_GROUPS[4],
  ACTIVITY_GROUPS[2],
  ACTIVITY_GROUPS[3],
  ACTIVITY_GROUPS[1],
  ACTIVITY_GROUPS[5],
  ACTIVITY_GROUPS[0]
];

const DEFAULT_GROUP = ACTIVITY_GROUPS[ACTIVITY_GROUPS.length - 1];

/** Resolves the status group for a set of signals (primary plus additional types of one event). */
export function resolveActivityGroup(signals: readonly (EventType | undefined)[]): ActivityGroup {
  return (
    ACTIVITY_GROUPS.find(group => signals.some(signal => !!signal && group.eventTypes.includes(signal))) ??
    DEFAULT_GROUP
  );
}
