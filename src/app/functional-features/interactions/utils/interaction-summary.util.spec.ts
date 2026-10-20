import { EventType, InteractionEvent, InteractionStatus, InteractionThread, ThreadOpportunity } from '../models/interaction.model';
import { summariseInteractions } from './interaction-summary.util';

describe('summariseInteractions', () => {
  const now = new Date('2026-10-18T10:00:00Z');

  const opportunity = (interviewDate?: string): ThreadOpportunity => ({
    title: 'Java Developer',
    facts: { skills: [], dealBreakers: [], interviewDate },
    lastSeen: now
  });

  const event = (eventType: EventType, additionalEventTypes: EventType[] = []): InteractionEvent => ({
    id: `${eventType}-${additionalEventTypes.join('-')}`,
    interactionThreadId: 't',
    eventType,
    additionalEventTypes,
    channel: 'EMAIL' as InteractionEvent['channel'],
    content: '',
    timestamp: now,
    senderId: 'recruiter',
    senderName: 'Recruiter'
  });

  const thread = (
    id: string,
    eventTypes: EventType[] = [EventType.OUTREACH],
    options: { status?: InteractionStatus; participantId?: string; opportunities?: ThreadOpportunity[] } = {}
  ): InteractionThread => ({
    id,
    participantId: options.participantId ?? id,
    participantName: 'Recruiter',
    participantRole: 'RECRUITER',
    status: options.status ?? InteractionStatus.NEW,
    opportunities: options.opportunities ?? [],
    lastEventDate: now,
    lastEventPreview: '',
    unreadCount: 0,
    createdAt: now,
    updatedAt: now,
    events: eventTypes.map(type => event(type))
  });

  it('returns zeros when there are no threads', () => {
    expect(summariseInteractions([], now)).toEqual({
      activeInteractions: 0,
      upcomingInterviews: 0,
      newOpportunities: 0,
      recruiters: 0
    });
  });

  it('does not count threads that reached the closed stage, even when the backend status is still NEW', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.OUTREACH, EventType.CV_REQUEST]),
      thread('2', [EventType.OUTREACH, EventType.REJECTION]),
      thread('3', [EventType.OUTREACH, EventType.NOT_INTERESTED]),
      thread('4', [EventType.OUTREACH, EventType.SCREENING_ASSESSMENT_FAILED])
    ], now);

    expect(summary.activeInteractions).toBe(1);
  });

  it('counts a closure signal that arrives as an additional event type', () => {
    const closed = thread('1');
    closed.events = [event(EventType.FOLLOW_UP, [EventType.REJECTION])];

    expect(summariseInteractions([closed], now).activeInteractions).toBe(0);
  });

  it('does not count threads closed by the backend', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.OUTREACH], { status: InteractionStatus.CLOSED }),
      thread('2', [EventType.OUTREACH], { status: InteractionStatus.ACTIVE })
    ], now);

    expect(summary.activeInteractions).toBe(1);
  });

  it('counts only active threads still at first contact as new opportunities', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.OUTREACH]),
      thread('2', [EventType.OUTREACH, EventType.REPLY]),
      thread('3', [EventType.OUTREACH, EventType.CV_REQUEST]),
      thread('4', [EventType.OUTREACH, EventType.INTERVIEW_SCHEDULED]),
      thread('5', [EventType.OUTREACH, EventType.REJECTION])
    ], now);

    expect(summary.activeInteractions).toBe(4);
    expect(summary.newOpportunities).toBe(2);
  });

  it('counts a thread once when it has a future interview date', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.INTERVIEW_SCHEDULED], { opportunities: [opportunity('2026-10-25T09:00:00Z'), opportunity('2026-11-02T09:00:00Z')] })
    ], now);

    expect(summary.upcomingInterviews).toBe(1);
  });

  it('ignores past, unparseable, missing and closed-thread interview dates', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.INTERVIEW_SCHEDULED], { opportunities: [opportunity('2026-10-01T09:00:00Z')] }),
      thread('2', [EventType.INTERVIEW_SCHEDULED], { opportunities: [opportunity('sometime next week')] }),
      thread('3', [EventType.INTERVIEW_SCHEDULED], { opportunities: [opportunity()] }),
      thread('4', [EventType.INTERVIEW_SCHEDULED, EventType.REJECTION], { opportunities: [opportunity('2026-10-25T09:00:00Z')] }),
      thread('5', [EventType.INTERVIEW_SCHEDULED])
    ], now);

    expect(summary.upcomingInterviews).toBe(0);
  });

  it('counts distinct recruiters across all threads, including closed ones', () => {
    const summary = summariseInteractions([
      thread('1', [EventType.OUTREACH], { participantId: 'recruiter-a' }),
      thread('2', [EventType.REJECTION], { participantId: 'recruiter-a' }),
      thread('3', [EventType.OUTREACH], { participantId: 'recruiter-b' })
    ], now);

    expect(summary.recruiters).toBe(2);
  });
});
