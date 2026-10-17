import { of } from 'rxjs';
import { InteractionsComponent } from './interactions.component';
import { InteractionService } from './services/interaction.service';
import { EmailSyncService } from './services/email-sync.service';
import { EventType, InteractionStatus, ChannelType } from './models/interaction.model';

describe('InteractionsComponent', () => {
  let component: InteractionsComponent;
  let interactionService: jasmine.SpyObj<InteractionService>;
  let emailSyncService: jasmine.SpyObj<EmailSyncService>;

  beforeEach(() => {
    interactionService = jasmine.createSpyObj('InteractionService', ['getThreads', 'refreshThreads', 'clearCache', 'markAsRead', 'createEvent']);
    emailSyncService = jasmine.createSpyObj('EmailSyncService', ['syncNow']);

    interactionService.getThreads.and.returnValue(of([]));
    interactionService.refreshThreads.and.returnValue(of([]));
    emailSyncService.syncNow.and.returnValue(of({
      userId: 'user-123',
      syncedAt: '2026-10-09T00:00:00Z',
      totalFetched: 2,
      processed: 2,
      skipped: 0,
      failed: 0,
      errors: [],
      durationMs: 200,
      success: true
    }));

    component = new InteractionsComponent(interactionService, emailSyncService);
  });

  it('defaults to candidate insights mode', () => {
    expect(component.getCurrentCenterPanelMode()).toBe('candidate-insights');
  });

  it('resolves fit status using helper methods instead of inline arrow expressions', () => {
    const thread = {
      id: 'thread-fit',
      participantId: 'recruiter-fit',
      participantName: 'Jordan Lee',
      participantRole: 'RECRUITER' as const,
      companyName: 'Northstar Labs',
      jobTitle: 'Senior Product Engineer',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-11T12:00:00Z'),
      lastEventPreview: 'Location needs met',
      unreadCount: 0,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-11T12:00:00Z'),
      events: [
        { id: 'e1', interactionThreadId: 'thread-fit', eventType: EventType.LOCATION_NEEDS_MET, channel: ChannelType.EMAIL, content: 'Location aligned', timestamp: new Date('2026-10-11T12:00:00Z'), senderId: 'recruiter-fit', senderName: 'Jordan Lee' }
      ]
    };

    expect(component.hasAnyEventType(thread as any, [EventType.LOCATION_NEEDS_MET, EventType.LOCATION_BOTTLENECK])).toBeTrue();
    expect(component.getLocationFitStatus(thread as any)).toBe('Aligned');
  });

  it('switches to the candidate insights mode when configured', () => {
    component.interactionMode = 'candidate';

    expect(component.getCurrentCenterPanelMode()).toBe('candidate-insights');
  });

  it('stores the compact timeline preference in the session for admin mode', () => {
    component.toggleTimelineDensity();

    expect(component.timelineDensity).toBe('compact');
    expect(sessionStorage.getItem('more.interactions.timelineDensity')).toBe('compact');
  });

  it('merges primary and additional event signals when calculating candidate stage', () => {
    const thread = {
      id: 'thread-3',
      participantId: 'recruiter-3',
      participantName: 'Priya Singh',
      participantRole: 'RECRUITER' as const,
      companyName: 'Meridian Health',
      jobTitle: 'Product Designer',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-11T12:00:00Z'),
      lastEventPreview: 'Interview accepted',
      unreadCount: 0,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-11T12:00:00Z'),
      events: [
        {
          id: 'e1',
          interactionThreadId: 'thread-3',
          eventType: EventType.OUTREACH,
          channel: ChannelType.EMAIL,
          content: 'Initial outreach',
          timestamp: new Date('2026-10-01T12:00:00Z'),
          senderId: 'recruiter-3',
          senderName: 'Priya Singh',
          additionalEventTypes: [EventType.INTEREST_CHECK]
        },
        {
          id: 'e2',
          interactionThreadId: 'thread-3',
          eventType: EventType.INTERVIEW_TIME_PROPOSED,
          channel: ChannelType.LINKEDIN,
          content: 'Proposed interview slot',
          timestamp: new Date('2026-10-10T12:00:00Z'),
          senderId: 'recruiter-3',
          senderName: 'Priya Singh',
          additionalEventTypes: [EventType.INTERVIEW_TIME_ACCEPTED]
        }
      ]
    };

    const insight = component.getCandidateInsightSummary(thread);

    expect(insight?.stage).toBe('Interviewing');
    expect(insight?.confidence).toBe('High');
    expect(insight?.nextUnlock).toContain('interview');
  });

  describe('activity timeline', () => {
    const buildThread = (events: Array<{ type: EventType; day: number; additional?: EventType[] }>) => ({
      id: 'thread-stage',
      participantId: 'recruiter-stage',
      participantName: 'Sam Reid',
      participantRole: 'RECRUITER' as const,
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date(2026, 9, 20),
      lastEventPreview: '',
      unreadCount: 0,
      createdAt: new Date(2026, 9, 1),
      updatedAt: new Date(2026, 9, 20),
      events: events.map((event, index) => ({
        id: `e${index}`,
        interactionThreadId: 'thread-stage',
        eventType: event.type,
        channel: ChannelType.EMAIL,
        content: '',
        timestamp: new Date(2026, 9, event.day),
        senderId: 'recruiter-stage',
        senderName: 'Sam Reid',
        additionalEventTypes: event.additional
      }))
    });

    it('shows screening as the current step and interview as the next step', () => {
      const { steps } = component.getActivityTimeline(buildThread([
        { type: EventType.OUTREACH, day: 1 },
        { type: EventType.CV_REQUEST, day: 2 },
        { type: EventType.JOB_SPEC_ATTACHED, day: 3 }
      ]) as any);

      expect(steps.map(step => [step.label, step.state, step.current])).toEqual([
        ['Outreach', 'past', false],
        ['Screening', 'current', true],
        ['Interviews & Assessments', 'upcoming', false],
        ['Closed', 'upcoming', false]
      ]);
      expect(steps[0].count).toBe(1);
      expect(steps[1].count).toBe(2);
    });

    it('shows offer only once the process reaches interviews', () => {
      const { steps } = component.getActivityTimeline(buildThread([
        { type: EventType.OUTREACH, day: 1 },
        { type: EventType.CV_SUBMITTED, day: 2 },
        { type: EventType.INTERVIEW_SCHEDULED, day: 3 }
      ]) as any);

      expect(steps.map(step => step.label)).toEqual(['Outreach', 'Screening', 'Interviews & Assessments', 'Offer stage', 'Closed']);
      expect(steps[2].current).toBeTrue();
      expect(steps[3].state).toBe('upcoming');
    });

    it('keeps closed as the terminal step when the thread ends in rejection', () => {
      const { steps } = component.getActivityTimeline(buildThread([
        { type: EventType.OUTREACH, day: 1 },
        { type: EventType.REJECTION, day: 2 }
      ]) as any);

      expect(steps.map(step => step.label)).toEqual(['Outreach', 'Screening', 'Interviews & Assessments', 'Unsuccessful', 'Closed']);
      expect(steps[3].state).toBe('past');
      expect(steps[4].current).toBeTrue();
      expect(steps[4].state).toBe('current');
    });

    it('returns the same result object until the thread changes so the template binding stays stable', () => {
      const thread = buildThread([{ type: EventType.OUTREACH, day: 1 }]) as any;

      const first = component.getActivityTimeline(thread);
      expect(component.getActivityTimeline(thread)).toBe(first);

      thread.events.push({
        id: 'e-new',
        interactionThreadId: 'thread-stage',
        eventType: EventType.CV_SUBMITTED,
        channel: ChannelType.EMAIL,
        content: '',
        timestamp: new Date(2026, 9, 3),
        senderId: 'recruiter-stage',
        senderName: 'Sam Reid'
      });

      const second = component.getActivityTimeline(thread);
      expect(second).not.toBe(first);
      expect(second.steps.length).toBe(4);
      expect(second.steps.find(step => step.current)?.label).toBe('Screening');
    });

    it('returns no steps without a thread or events', () => {
      expect(component.getActivityTimeline(null)).toEqual({ steps: [] });
      expect(component.getActivityTimeline(buildThread([]) as any)).toEqual({ steps: [] });
    });
  });

  it('builds a candidate insight summary from the latest signals', () => {
    const thread = {
      id: 'thread-1',
      participantId: 'recruiter-1',
      participantName: 'Sarah Chen',
      participantRole: 'RECRUITER' as const,
      companyName: 'Northstar Labs',
      jobTitle: 'Senior Product Engineer',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-10T12:00:00Z'),
      lastEventPreview: 'Screening assessment passed',
      unreadCount: 0,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-10T12:00:00Z'),
      events: [
        { id: 'e1', interactionThreadId: 'thread-1', eventType: EventType.OUTREACH, channel: ChannelType.LINKEDIN, content: 'Initial outreach', timestamp: new Date('2026-10-01T12:00:00Z'), senderId: 'recruiter-1', senderName: 'Sarah Chen' },
        { id: 'e2', interactionThreadId: 'thread-1', eventType: EventType.JOB_SPEC_ATTACHED, channel: ChannelType.EMAIL, content: 'Job spec attached', timestamp: new Date('2026-10-04T12:00:00Z'), senderId: 'recruiter-1', senderName: 'Sarah Chen' },
        { id: 'e3', interactionThreadId: 'thread-1', eventType: EventType.SCREENING_ASSESSMENT_PASSED, channel: ChannelType.EMAIL, content: 'Screening passed', timestamp: new Date('2026-10-09T12:00:00Z'), senderId: 'recruiter-1', senderName: 'Sarah Chen', additionalEventTypes: [EventType.LOCATION_INQUIRY] }
      ]
    };

    const insight = component.getCandidateInsightSummary(thread);

    expect(insight).not.toBeNull();
    expect(insight?.stage).toBe('Qualified');
    expect(insight?.confidence).toBe('Medium');
    expect(insight?.nextUnlock).toContain('role fit');
    expect(insight?.actions.length).toBeGreaterThan(0);
  });

  it('highlights the main candidate blockers in a risk summary', () => {
    const thread = {
      id: 'thread-2',
      participantId: 'recruiter-2',
      participantName: 'Alex Morgan',
      participantRole: 'RECRUITER' as const,
      companyName: 'Apex Systems',
      jobTitle: 'Senior Full Stack Engineer',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-08T12:00:00Z'),
      lastEventPreview: 'Location mismatch reported',
      unreadCount: 1,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-08T12:00:00Z'),
      events: [
        { id: 'e1', interactionThreadId: 'thread-2', eventType: EventType.LOCATION_INQUIRY, channel: ChannelType.EMAIL, content: 'Location needs?', timestamp: new Date('2026-10-07T12:00:00Z'), senderId: 'recruiter-2', senderName: 'Alex Morgan' },
        { id: 'e2', interactionThreadId: 'thread-2', eventType: EventType.LOCATION_BOTTLENECK, channel: ChannelType.LINKEDIN, content: 'Hybrid mismatch', timestamp: new Date('2026-10-08T12:00:00Z'), senderId: 'recruiter-2', senderName: 'Alex Morgan' }
      ]
    };

    const risks = component.getCandidateRiskItems(thread);

    expect(risks.length).toBeGreaterThan(0);
    expect(risks[0].label).toContain('Location');
    expect(risks[0].severity).toBe('High');
  });

  describe('client opportunities', () => {
    const baseThread = {
      id: 'thread-opp',
      participantId: 'recruiter-opp',
      participantName: 'Steven Smith',
      participantRole: 'RECRUITER' as const,
      companyName: 'Recruiter Agency',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date(),
      lastEventPreview: 'Hello',
      unreadCount: 0,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-11T12:00:00Z'),
      events: []
    };
    const opportunity = (title: string | undefined, company: string | undefined, dealBreakers: string[] = []) => ({
      companyName: company,
      title,
      lastSeen: new Date('2026-10-11T12:00:00Z'),
      facts: { skills: [], dealBreakers }
    });

    it('shows the role at the client company, never the recruiter company', () => {
      const thread = { ...baseThread, opportunities: [opportunity('Senior Java Developer', 'Best Bank')] };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for Senior Java Developer at Best Bank');
    });

    it('shows only the role when no client company was named', () => {
      const thread = { ...baseThread, opportunities: [opportunity('Senior Java Developer', undefined)] };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for Senior Java Developer');
    });

    it('shows a generic role label when only the company is known', () => {
      const thread = { ...baseThread, opportunities: [opportunity(undefined, 'Best Bank')] };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting at Best Bank');
    });

    it('falls back to the generic label when the opportunity has neither role nor company', () => {
      const thread = { ...baseThread, opportunities: [opportunity('missing', 'Unknown')] };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for a role');
    });

    it('adds a +N more hint when the thread covers several opportunities', () => {
      const thread = {
        ...baseThread,
        opportunities: [opportunity('Java Developer', 'Best Bank'), opportunity('Tester', 'Other Corp'), opportunity('Analyst', 'Third Inc')]
      };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for Java Developer at Best Bank +2 more');
      expect(component.getAdditionalOpportunityLabels(thread)).toEqual(['Tester at Other Corp', 'Analyst at Third Inc']);
    });

    it('ignores recruiter-company mirrors when choosing the client headline', () => {
      const thread = {
        ...baseThread,
        companyName: 'AES Global',
        opportunities: [
          opportunity('Senior Java Engineer', 'AES Global'),
          opportunity('Data Engineer', 'Best Bank')
        ]
      };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for Data Engineer at Best Bank');
    });

    it('collapses same-company untitled duplicates so +N reflects meaningful extras', () => {
      const thread = {
        ...baseThread,
        opportunities: [
          opportunity(undefined, 'Equal Experts'),
          opportunity('Senior Java Engineer', 'Equal Experts'),
          opportunity('Staff Engineer', 'Equal Experts')
        ]
      };

      expect(component.getOpportunityTitle(thread)).toBe('Recruiting for Senior Java Engineer at Equal Experts +1 more');
      expect(component.getAdditionalOpportunityLabels(thread)).toEqual(['Staff Engineer at Equal Experts']);
    });

    it('keeps the legacy wording when no opportunities were extracted', () => {
      expect(component.getOpportunityTitle({ ...baseThread, jobTitle: 'Java Developer' })).toBe('Recruiting for a Java Developer');
      expect(component.getOpportunityTitle({ ...baseThread, opportunities: [] })).toBe('Recruiting for a role');
      expect(component.getOpportunityTitle(null)).toBe('Recruiting for a role');
    });

    it('builds the overview heading from the client opportunity instead of the recruiter company', () => {
      const thread = { ...baseThread, jobTitle: 'Legacy Title', opportunities: [opportunity('Java Developer', 'Best Bank')] };

      expect(component.getOpportunityHeading(thread)).toBe('Best Bank \u00b7 Java Developer');
      expect(component.getOpportunityHeading({ ...baseThread, jobTitle: 'Legacy Title' })).toBe('Opportunity \u00b7 Legacy Title');
      expect(component.getOpportunityHeading({ ...baseThread })).toBe('Opportunity \u00b7 Role conversation');
      expect(component.getOpportunityHeading(null)).toBe('Opportunity \u00b7 Role conversation');
    });

    it('links to the verified client website and returns nothing when the client site is unknown', () => {
      const withWebsite = {
        ...baseThread,
        opportunities: [{ ...opportunity('Java Developer', 'Best Bank'), companyWebsite: 'https://bestbank.co.za' }]
      };

      expect(component.getCompanyWebsiteUrl(withWebsite)).toBe('https://bestbank.co.za');
      expect(component.getCompanyWebsiteUrl({ ...baseThread, opportunities: [opportunity('Java Developer', 'Best Bank')] })).toBeNull();
    });

    it('counts deal breakers stated in the emails once, across opportunities', () => {
      const thread = {
        ...baseThread,
        lastEventDate: new Date(),
        opportunities: [
          opportunity('Java Developer', 'Best Bank', ['On site 3 days', 'No visa support']),
          opportunity('Tester', 'Other Corp', [' on site 3 days ', ' '])
        ]
      };

      const risks = component.getCandidateRiskItems(thread);

      expect(risks.map(risk => risk.summary)).toEqual(['On site 3 days', 'No visa support']);
      expect(risks.every(risk => risk.label === 'Deal breaker' && risk.severity === 'High')).toBeTrue();
      expect(component.getDealBreakerCount(thread)).toBe(2);
    });

    it('lists the stated deal breakers once for the opportunity overview', () => {
      const thread = {
        ...baseThread,
        opportunities: [
          opportunity('Java Developer', 'Best Bank', ['On site 3 days']),
          opportunity('Tester', 'Other Corp', [' on site 3 days ', 'No visa support'])
        ]
      };

      expect(component.getDealBreakerLabels(thread)).toEqual(['On site 3 days', 'No visa support']);
      expect(component.getDealBreakerLabels(null)).toEqual([]);
    });

    it('pairs each fit dimension with the stated fact and status', () => {
      const thread = {
        ...baseThread,
        events: [
          { id: 'e1', interactionThreadId: 'thread-opp', eventType: EventType.LOCATION_NEEDS_MET, channel: ChannelType.EMAIL, content: 'ok', timestamp: new Date('2026-10-10T12:00:00Z'), senderId: 'recruiter-opp', senderName: 'Steven Smith' },
          { id: 'e2', interactionThreadId: 'thread-opp', eventType: EventType.COMPENSATION_BOTTLENECK, channel: ChannelType.EMAIL, content: 'low', timestamp: new Date('2026-10-11T12:00:00Z'), senderId: 'recruiter-opp', senderName: 'Steven Smith' }
        ],
        opportunities: [{
          ...opportunity('Java Developer', 'Best Bank'),
          facts: { skills: ['Java', 'Spring', 'SQL', 'AWS', 'Docker', 'Kafka'], dealBreakers: [], workMode: 'Hybrid', location: 'Cape Town', salary: 'R1.2m' }
        }]
      };

      expect(component.getFitRows(thread)).toEqual([
        { label: 'Role', status: 'Needs review', tone: 'neutral', detail: 'Java, Spring, SQL, AWS +2' },
        { label: 'Location', status: 'Aligned', tone: 'success', detail: 'Hybrid, Cape Town' },
        { label: 'Compensation', status: 'At risk', tone: 'danger', detail: 'R1.2m' },
        { label: 'Timing', status: 'Pending', tone: 'neutral', detail: undefined }
      ]);
      expect(component.getFitRows(null)).toEqual([]);
    });
  });

  it('never links to the recruiter company website when no client website is known', () => {
    const thread = {
      id: 'thread-aesglobal',
      participantId: 'recruiter-aesglobal',
      participantName: 'Steven Smith',
      participantRole: 'RECRUITER' as const,
      companyName: 'Aesglobal',
      jobTitle: 'Senior Java Developer',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-11T12:00:00Z'),
      lastEventPreview: 'Interview scheduled',
      unreadCount: 0,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-11T12:00:00Z'),
      events: []
    };

    expect(component.getCompanyWebsiteUrl(thread as any)).toBeNull();
    expect(component.getCompanyWebsiteUrl(null)).toBeNull();
  });

  it('triggers email sync and refreshes the thread list when a sync succeeds', () => {
    component.triggerEmailSync();

    expect(emailSyncService.syncNow).toHaveBeenCalled();
    expect(component.syncInProgress).toBeFalse();
    expect(component.syncFeedback).toBe('2 new interactions imported');
  });

  describe('activity group', () => {
    const threadWithLastEvent = (eventType: EventType, additionalEventTypes: EventType[] = []) => ({
      id: `thread-${eventType}`,
      participantId: 'recruiter-activity',
      participantName: 'Recruiter Activity',
      participantRole: 'RECRUITER' as const,
      companyName: 'Activity Co',
      status: InteractionStatus.ACTIVE,
      lastEventDate: new Date('2026-10-01T12:00:00Z'),
      lastEventPreview: 'Preview',
      unreadCount: 0,
      createdAt: new Date('2026-09-20T12:00:00Z'),
      updatedAt: new Date('2026-10-01T12:00:00Z'),
      events: [
        {
          id: `event-${eventType}`,
          interactionThreadId: `thread-${eventType}`,
          eventType,
          additionalEventTypes,
          channel: ChannelType.EMAIL,
          content: 'Event content',
          timestamp: new Date('2026-10-01T12:00:00Z'),
          senderId: 'recruiter-activity',
          senderName: 'Recruiter Activity'
        }
      ]
    });

    it('maps the accordion header to the current stage instead of the latest activity group', () => {
      const location = threadWithLastEvent(EventType.LOCATION_INQUIRY);
      const compensation = threadWithLastEvent(EventType.COMPENSATION_INQUIRY);

      expect(component.getThreadStageLabel(location as any)).toBe('Screening');
      expect(component.getThreadStageLabel(compensation as any)).toBe('Screening');
      expect(component.getThreadStageClass(location as any)).toBe('activity-info');
    });

    it('colours the stage chip by how progressed the thread is', () => {
      expect(component.getThreadStageClass(threadWithLastEvent(EventType.OUTREACH) as any)).toBe('activity-neutral');
      expect(component.getThreadStageClass(threadWithLastEvent(EventType.INTERVIEW_SCHEDULED) as any)).toBe('activity-success');
      expect(component.getThreadStageClass(threadWithLastEvent(EventType.COMPENSATION_INQUIRY) as any)).toBe('activity-info');
      expect(component.getThreadStageClass(threadWithLastEvent(EventType.REJECTION) as any)).toBe('activity-neutral');
    });

    it('uses additional event types so the most significant stage wins', () => {
      const thread = threadWithLastEvent(EventType.REPLY, [EventType.LOCATION_INQUIRY]);

      expect(component.getThreadStageLabel(thread as any)).toBe('Screening');
    });
  });

});
