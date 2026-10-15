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

  it('keeps the default admin timeline panel active', () => {
    expect(component.getCurrentCenterPanelMode()).toBe('timeline');
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
    expect(insight?.stage).toBe('Interviewing');
    expect(insight?.confidence).toBe('High');
    expect(insight?.nextUnlock).toContain('interview');
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

  it('returns the known company website for Aesglobal so the link can be opened from the expanded body', () => {
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

    expect(component.getCompanyWebsiteUrl(thread as any)).toBe('https://www.aesglobal.io');
  });

  it('triggers email sync and refreshes the thread list when a sync succeeds', () => {
    component.triggerEmailSync();

    expect(emailSyncService.syncNow).toHaveBeenCalled();
    expect(component.syncInProgress).toBeFalse();
    expect(component.syncFeedback).toBe('2 new interactions imported');
  });
});
