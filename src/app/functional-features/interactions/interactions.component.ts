import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { InteractionService } from './services/interaction.service';
import { InteractionThread, InteractionEvent, ChannelType, EventType, InteractionStatus } from './models/interaction.model';
import { EmailThreadTimelineComponent } from './email-thread-timeline/email-thread-timeline.component';

@Component({
  selector: 'app-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule, EmailThreadTimelineComponent],
  templateUrl: './interactions.component.html',
  styleUrls: ['./interactions.component.css']
})
export class InteractionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  threads: InteractionThread[] = [];
  filteredThreads: InteractionThread[] = [];
  selectedThread: InteractionThread | null = null;
  searchQuery: string = '';
  showInsightsPanel: boolean = true;
  isRefreshing: boolean = false;
  
  // For new event
  showNewEventModal: boolean = false;
  newEventType: EventType = EventType.OUTREACH;
  newEventChannel: ChannelType = ChannelType.LINKEDIN;
  newEventContent: string = '';
  
  // For new thread creation
  showNewThreadModal: boolean = false;
  newThreadRecruiterName: string = '';
  newThreadCompany: string = '';
  newThreadJobTitle: string = '';
  newThreadEventType: EventType = EventType.OUTREACH;
  newThreadChannel: ChannelType = ChannelType.LINKEDIN;
  newThreadContent: string = '';
  
  // For add company modal
  showAddCompanyModal: boolean = false;
  selectedThreadForCompany: InteractionThread | null = null;
  newCompanyName: string = '';
  
  // Enums for template
  ChannelType = ChannelType;
  EventType = EventType;
  InteractionStatus = InteractionStatus;

  constructor(private interactionService: InteractionService) {}

  ngOnInit(): void {
    // Clear cache on app refresh to always get fresh data
    this.interactionService.clearCache();
    this.loadThreads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadThreads(): void {
    // Subscribe to cached threads observable
    this.interactionService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => {
        this.threads = threads.sort((a, b) => 
          b.lastEventDate.getTime() - a.lastEventDate.getTime()
        );
        this.filteredThreads = [...this.threads];
        
        // Auto-select first thread if none selected
        if (!this.selectedThread && this.threads.length > 0) {
          this.selectThread(this.threads[0]);
        }
      });
    
    // Trigger initial load if not already loaded
    this.interactionService.getThreads().pipe(takeUntil(this.destroy$)).subscribe();
  }

  refreshThreads(): void {
    this.isRefreshing = true;
    this.interactionService.refreshThreads()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isRefreshing = false;
      });
  }

  selectThread(thread: InteractionThread): void {
    this.selectedThread = thread;
    if (thread.unreadCount > 0) {
      this.interactionService.markAsRead(thread.id).subscribe();
    }
  }

  getSelectedThreadIds(): string[] {
    if (!this.selectedThread) {
      return [];
    }

    return [...new Set(this.selectedThread.events
      .map(event => event.threadId)
      .filter((threadId): threadId is string => Boolean(threadId)))];
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredThreads = [...this.threads];
      return;
    }
    
    this.filteredThreads = this.threads.filter(thread =>
      thread.participantName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      thread.jobTitle?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      thread.companyName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openNewEventModal(): void {
    this.showNewEventModal = true;
  }

  closeNewEventModal(): void {
    this.showNewEventModal = false;
    this.newEventType = EventType.OUTREACH;
    this.newEventChannel = ChannelType.LINKEDIN;
    this.newEventContent = '';
  }

  openNewThreadModal(): void {
    this.showNewThreadModal = true;
  }

  closeNewThreadModal(): void {
    this.showNewThreadModal = false;
    this.newThreadRecruiterName = '';
    this.newThreadCompany = '';
    this.newThreadJobTitle = '';
    this.newThreadEventType = EventType.OUTREACH;
    this.newThreadChannel = ChannelType.LINKEDIN;
    this.newThreadContent = '';
  }

  createNewThread(): void {
    if (!this.newThreadRecruiterName.trim() || !this.newThreadContent.trim()) {
      alert('Recruiter name and initial message are required');
      return;
    }

    // TODO: Replace with actual API call to create new thread
    const newThread: InteractionThread = {
      id: Math.random().toString(36).substr(2, 9),
      participantId: 'recruiter-' + Math.random().toString(36).substr(2, 9),
      participantName: this.newThreadRecruiterName,
      participantRole: 'RECRUITER',
      companyName: this.newThreadCompany || undefined,
      jobTitle: this.newThreadJobTitle || undefined,
      status: InteractionStatus.NEW,
      lastEventDate: new Date(),
      lastEventPreview: this.newThreadContent.substring(0, 100),
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [
        {
          id: Math.random().toString(36).substr(2, 9),
          interactionThreadId: '',
          eventType: this.newThreadEventType,
          channel: this.newThreadChannel,
          content: this.newThreadContent,
          timestamp: new Date(),
          senderId: 'current-user',
          senderName: 'You'
        }
      ]
    };

    // Add to local threads array (TODO: call backend API)
    this.threads.unshift(newThread);
    this.filteredThreads = [...this.threads];
    
    // Select the newly created thread
    this.selectThread(newThread);
    
    this.closeNewThreadModal();
  }

  logEvent(): void {
    if (!this.newEventContent.trim() || !this.selectedThread) return;

    const request = {
      interactionThreadId: this.selectedThread.id,
      eventType: this.newEventType,
      channel: this.newEventChannel,
      content: this.newEventContent
    };

    this.interactionService.createEvent(request).subscribe(event => {
      this.selectedThread!.events.push(event);
      this.selectedThread!.lastEventDate = event.timestamp;
      this.selectedThread!.lastEventPreview = event.content;
      this.closeNewEventModal();
      
      // Refresh threads to get latest data from backend
      this.refreshThreads();
    });
  }

  getChannelIcon(channel: ChannelType): string {
    const icons: { [key in ChannelType]: string } = {
      [ChannelType.MO_NATIVE]: 'chat',
      [ChannelType.EMAIL]: 'email',
      [ChannelType.LINKEDIN]: 'linkedin',
      [ChannelType.PHONE]: 'phone',
      [ChannelType.WHATSAPP]: 'whatsapp',
      [ChannelType.IN_PERSON]: 'users',
      [ChannelType.VIDEO_CALL]: 'video',
      [ChannelType.TEXT_MESSAGE]: 'message',
      [ChannelType.OTHER]: 'dots'
    };
    return icons[channel];
  }

  getChannelColor(channel: ChannelType): string {
    const colors: { [key in ChannelType]: string } = {
      [ChannelType.MO_NATIVE]: '#0ea5e9',
      [ChannelType.EMAIL]: '#ea4335',
      [ChannelType.LINKEDIN]: '#0077b5',
      [ChannelType.PHONE]: '#6366f1',
      [ChannelType.WHATSAPP]: '#25d366',
      [ChannelType.IN_PERSON]: '#8b5cf6',
      [ChannelType.VIDEO_CALL]: '#ec4899',
      [ChannelType.TEXT_MESSAGE]: '#10b981',
      [ChannelType.OTHER]: '#6b7280'
    };
    return colors[channel];
  }

  getStatusBadgeClass(status: InteractionStatus): string {
    const classes: { [key in InteractionStatus]: string } = {
      [InteractionStatus.NEW]: 'badge-info',
      [InteractionStatus.ACTIVE]: 'badge-success',
      [InteractionStatus.STALE]: 'badge-warning',
      [InteractionStatus.CLOSED]: 'badge-gray'
    };
    return classes[status];
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getThreadStatusSummary(thread: InteractionThread): string {
    const lastEvent = thread.events[thread.events.length - 1];
    if (!lastEvent) {
      return thread.lastEventPreview || 'No activity yet';
    }

    const fromUser = lastEvent.senderId === 'current-user';

    switch (lastEvent.eventType) {
      case EventType.CV_REQUEST:
        return fromUser ? 'You requested a CV update' : 'They are waiting for you to send CV';
      case EventType.CV_SUBMITTED:
        return fromUser ? 'You sent your CV' : 'They shared a CV with you';
      case EventType.SCREENING_ASSESSMENT_REQUEST:
        return fromUser ? 'You requested a screening assessment' : 'They asked you to complete a screening assessment';
      case EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT:
        return fromUser ? 'You acknowledged the screening assessment completion' : 'They acknowledged the screening assessment completion';
      case EventType.SCREENING_ASSESSMENT_SCHEDULED:
        return fromUser ? 'You scheduled the screening assessment' : 'They scheduled the screening assessment';
      case EventType.SCREENING_ASSESSMENT_COMPLETED:
        return fromUser ? 'You completed the screening assessment' : 'They completed the screening assessment';
      case EventType.SCREENING_ASSESSMENT_FAILED:
        return fromUser ? 'You flagged a failed screening assessment' : 'They flagged a failed screening assessment';
      case EventType.INTERVIEW_TIME_PROPOSED:
        return fromUser ? 'You proposed an interview time' : 'They proposed an interview time';
      case EventType.INTERVIEW_ACCEPTED:
        return fromUser ? 'You accepted the interview time' : 'They accepted the interview time';
      case EventType.INTERVIEW_SCHEDULED:
        return fromUser ? 'You scheduled the interview' : 'They scheduled the interview';
      case EventType.INTERVIEW_INVITE:
        return fromUser ? 'You proposed an interview time' : 'They invited you to interview';
      case EventType.JOB_SPEC_REQUEST:
        return fromUser ? 'You requested the job spec' : 'They requested the job spec';
      case EventType.JOB_SPEC_SHARED:
        return fromUser ? 'You shared the job spec' : 'They shared the job spec';
      case EventType.JOB_SPEC_REVIEWED:
        return fromUser ? 'You reviewed the job spec' : 'They reviewed the job spec';
      case EventType.JOB_SPEC_TO_BE_SENT:
        return fromUser ? 'You will send role details if needed' : 'They will send the job spec if you need it';
      case EventType.JOB_SPEC_ATTACHED:
        return fromUser ? 'You sent role details' : 'They sent you the job spec';
      case EventType.COMPENSATION_INQUIRY:
        return fromUser ? 'You asked about compensation' : 'They asked about your compensation expectations';
      case EventType.COMPENSATION_BOTTLENECK:
        return fromUser ? 'You flagged a compensation bottleneck' : 'They flagged a compensation bottleneck';
      case EventType.LOCATION_INQUIRY:
        return fromUser ? 'You asked about location setup' : 'They asked about your location preference';
      case EventType.LOCATION_BOTTLENECK:
        return fromUser ? 'You flagged a location bottleneck' : 'They flagged a location bottleneck';
      case EventType.RECRUITEMENT_PROCESS_UPDATE:
        return fromUser ? 'You shared a recruitment process update' : 'They shared a recruitment process update';
      case EventType.NOTICE_PERIOD_INQUIRY:
        return fromUser ? 'You asked about notice period' : 'They asked about your notice period';
      case EventType.AVAILABILITY_INQUIRY:
        return fromUser ? 'You asked about availability' : 'They asked about your availability';
      case EventType.VISA_INQUIRY:
        return fromUser ? 'You asked about visa support' : 'They asked about visa or sponsorship status';
      case EventType.BENEFITS_INQUIRY:
        return fromUser ? 'You asked about benefits' : 'They asked about benefits expectations';
      case EventType.INQUIRY:
        if (fromUser) {
          return 'You sent a hiring-related question';
        }
        return this.buildInquiryWaitingSummary(lastEvent.additionalEventTypes || []);
      case EventType.INTERESTED:
        return fromUser ? 'You confirmed interest in the role' : 'They confirmed interest to continue';
      case EventType.INTEREST_CHECK:
        return fromUser ? 'You asked if they are interested' : 'They are asking if you are interested';
      case EventType.ACKNOWLEDGEMENT:
        return fromUser ? 'You acknowledged their message' : 'They acknowledged your message';
      case EventType.NOT_INTERESTED:
        return fromUser ? 'You declined this opportunity' : 'They are no longer proceeding';
      case EventType.REJECTION:
        return fromUser ? 'You closed this opportunity' : 'They shared an unsuccessful outcome';
      case EventType.FOLLOW_UP:
        return fromUser ? 'You followed up for an update' : 'They followed up and are waiting for your response';
      case EventType.REPLY:
        return fromUser ? 'You replied and they may respond next' : 'They replied and are waiting for your response';
      case EventType.OUTREACH:
        return fromUser ? 'You initiated the conversation' : 'New recruiter outreach needs your response';
      case EventType.PENDING_CLASSIFICATION:
        return 'Not Classified';
      default:
        return thread.lastEventPreview || 'Latest status updated';
    }
  }

  private buildInquiryWaitingSummary(additionalTypes: EventType[]): string {
    const inquiryOrder: EventType[] = [
      EventType.LOCATION_INQUIRY,
      EventType.COMPENSATION_INQUIRY,
      EventType.NOTICE_PERIOD_INQUIRY,
      EventType.AVAILABILITY_INQUIRY,
      EventType.VISA_INQUIRY,
      EventType.BENEFITS_INQUIRY
    ];

    const labels: Record<EventType, string> = {
      [EventType.LOCATION_INQUIRY]: 'location',
      [EventType.LOCATION_BOTTLENECK]: 'location bottleneck',
      [EventType.COMPENSATION_INQUIRY]: 'salary',
      [EventType.COMPENSATION_BOTTLENECK]: 'compensation bottleneck',
      [EventType.NOTICE_PERIOD_INQUIRY]: 'notice period',
      [EventType.AVAILABILITY_INQUIRY]: 'availability',
      [EventType.VISA_INQUIRY]: 'visa status',
      [EventType.BENEFITS_INQUIRY]: 'benefits expectations',
      [EventType.OUTREACH]: 'outreach',
      [EventType.REPLY]: 'reply',
      [EventType.FOLLOW_UP]: 'follow up',
      [EventType.CV_REQUEST]: 'CV',
      [EventType.CV_SUBMITTED]: 'CV',
      [EventType.SCREENING_ASSESSMENT_REQUEST]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT]: 'screening assessment acknowledgement',
      [EventType.SCREENING_ASSESSMENT_SCHEDULED]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_COMPLETED]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_FAILED]: 'screening assessment outcome',
      [EventType.INTERVIEW_TIME_PROPOSED]: 'interview time',
      [EventType.INTERVIEW_ACCEPTED]: 'interview time',
      [EventType.INTERVIEW_SCHEDULED]: 'interview schedule',
      [EventType.INTERVIEW_INVITE]: 'interview availability',
      [EventType.JOB_SPEC_REQUEST]: 'job spec',
      [EventType.JOB_SPEC_SHARED]: 'job spec',
      [EventType.JOB_SPEC_REVIEWED]: 'job spec review',
      [EventType.JOB_SPEC_TO_BE_SENT]: 'role details',
      [EventType.JOB_SPEC_ATTACHED]: 'role details',
      [EventType.INQUIRY]: 'screening details',
      [EventType.INTERESTED]: 'interest confirmation',
      [EventType.INTEREST_CHECK]: 'interest confirmation',
      [EventType.ACKNOWLEDGEMENT]: 'acknowledgement',
      [EventType.NOT_INTERESTED]: 'interest decision',
      [EventType.REJECTION]: 'decision outcome',
      [EventType.RECRUITEMENT_PROCESS_UPDATE]: 'process update',
      [EventType.PENDING_CLASSIFICATION]: 'classification'
    };

    const ordered = inquiryOrder
      .filter(type => additionalTypes.includes(type))
      .map(type => labels[type]);

    if (ordered.length === 0) {
      return 'They are waiting on your answers to screening questions';
    }

    if (ordered.length === 1) {
      return `They are waiting for your ${ordered[0]} details`;
    }

    if (ordered.length === 2) {
      return `They are waiting for your ${ordered[0]} and ${ordered[1]} details`;
    }

    const head = ordered.slice(0, ordered.length - 1).join(', ');
    const tail = ordered[ordered.length - 1];
    return `They are waiting for your ${head}, and ${tail} details`;
  }

  addCompany(thread: InteractionThread): void {
    this.selectedThreadForCompany = thread;
    this.newCompanyName = '';
    this.showAddCompanyModal = true;
  }

  confirmAddCompany(): void {
    if (!this.newCompanyName.trim() || !this.selectedThreadForCompany) return;

    // TODO: Call backend API to update the interaction with company name
    this.selectedThreadForCompany.companyName = this.newCompanyName.trim();
    console.log(`Company "${this.newCompanyName}" added for ${this.selectedThreadForCompany.participantName}`);
    
    this.cancelAddCompany();
  }

  cancelAddCompany(): void {
    this.showAddCompanyModal = false;
    this.selectedThreadForCompany = null;
    this.newCompanyName = '';
  }

  // ========== INSIGHTS & ANALYTICS ==========
  
  toggleInsightsPanel(): void {
    this.showInsightsPanel = !this.showInsightsPanel;
  }

  getRecruiterResponseRate(): number {
    if (!this.selectedThread) return 0;
    const recruiterEvents = this.selectedThread.events.filter(e => e.senderId !== 'current-user');
    const userEvents = this.selectedThread.events.filter(e => e.senderId === 'current-user');
    if (userEvents.length === 0) return 0;
    return Math.round((recruiterEvents.length / userEvents.length) * 100);
  }

  getAverageResponseTime(): string {
    if (!this.selectedThread || this.selectedThread.events.length < 2) return 'N/A';
    
    let totalHours = 0;
    let responseCount = 0;
    
    for (let i = 1; i < this.selectedThread.events.length; i++) {
      const current = new Date(this.selectedThread.events[i].timestamp);
      const previous = new Date(this.selectedThread.events[i - 1].timestamp);
      const diffHours = (current.getTime() - previous.getTime()) / (1000 * 60 * 60);
      totalHours += diffHours;
      responseCount++;
    }
    
    const avgHours = totalHours / responseCount;
    if (avgHours < 1) return `${Math.round(avgHours * 60)} mins`;
    if (avgHours < 24) return `${Math.round(avgHours)} hours`;
    return `${Math.round(avgHours / 24)} days`;
  }

  getInteractionAge(): number {
    if (!this.selectedThread) return 0;
    const ageMs = Date.now() - new Date(this.selectedThread.createdAt).getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  getDaysSinceLastEvent(): number {
    if (!this.selectedThread) return 0;
    const diffMs = Date.now() - new Date(this.selectedThread.lastEventDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getRecommendedActions(): string[] {
    if (!this.selectedThread) return [];
    
    const actions: string[] = [];
    const daysSinceLastEvent = this.getDaysSinceLastEvent();
    const responseRate = this.getRecruiterResponseRate();
    
    // High-value recruiter
    if (responseRate > 80) {
      actions.push('🎯 High-value recruiter - prioritize this conversation');
    }
    
    // Needs follow-up
    if (daysSinceLastEvent > 3 && this.selectedThread.status === InteractionStatus.ACTIVE) {
      actions.push(`⏰ ${daysSinceLastEvent} days since last activity - consider following up`);
    }
    
    // Stale interaction
    if (this.selectedThread.status === InteractionStatus.STALE) {
      actions.push('⚠️ This interaction has gone stale - send a follow-up or close it');
    }
    
    // Personalization tip
    const lastEvent = this.selectedThread.events[this.selectedThread.events.length - 1];
    if (lastEvent.senderId !== 'current-user') {
      actions.push('📝 Personalize your reply - increases success rate by 3x');
    }
    
    // CV requested
    const hasCvRequest = this.selectedThread.events.some(e => e.eventType === EventType.CV_REQUEST);
    const hasCvSubmission = this.selectedThread.events.some(e =>
      e.eventType === EventType.CV_SUBMITTED ||
      (e.eventType as unknown as string) === 'CV_SUBMITED' ||
      (e.eventType as unknown as string) === 'CV_SUBMISSION'
    );
    if (hasCvRequest && !hasCvSubmission) {
      actions.push('📄 CV requested - submit your latest version');
    }
    
    // Interview invite without CV submission
    const hasInterviewInvite = this.selectedThread.events.some(e => e.eventType === EventType.INTERVIEW_INVITE);
    if (hasInterviewInvite && !hasCvSubmission) {
      actions.push('📄 Interview scheduled - submit your CV if you haven\'t already');
    }
    
    return actions;
  }

  getAlerts(): { type: 'warning' | 'info' | 'success', message: string }[] {
    const alerts: { type: 'warning' | 'info' | 'success', message: string }[] = [];
    
    const staleThreads = this.threads.filter(t => t.status === InteractionStatus.STALE).length;
    if (staleThreads > 0) {
      alerts.push({
        type: 'warning',
        message: `${staleThreads} interaction${staleThreads > 1 ? 's' : ''} need${staleThreads === 1 ? 's' : ''} attention`
      });
    }
    
    const needsFollowUp = this.threads.filter(t => {
      const daysSince = Math.floor((Date.now() - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7 && t.status === InteractionStatus.ACTIVE;
    }).length;
    
    if (needsFollowUp > 0) {
      alerts.push({
        type: 'info',
        message: `${needsFollowUp} conversation${needsFollowUp > 1 ? 's' : ''} awaiting follow-up (7+ days)`
      });
    }
    
    const activeCount = this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length;
    if (activeCount > 10) {
      alerts.push({
        type: 'success',
        message: `Great engagement! ${activeCount} active conversations`
      });
    }
    
    return alerts;
  }

  getChannelStats(): { channel: ChannelType, count: number, percentage: number }[] {
    if (!this.threads.length) return [];
    
    const channelCounts = new Map<ChannelType, number>();
    let totalEvents = 0;
    
    this.threads.forEach(thread => {
      thread.events.forEach(event => {
        channelCounts.set(event.channel, (channelCounts.get(event.channel) || 0) + 1);
        totalEvents++;
      });
    });
    
    return Array.from(channelCounts.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: Math.round((count / totalEvents) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getPipelineStats(): { label: string, value: number, color: string }[] {
    return [
      {
        label: 'New',
        value: this.threads.filter(t => t.status === InteractionStatus.NEW).length,
        color: '#0ea5e9'
      },
      {
        label: 'Active',
        value: this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length,
        color: '#10b981'
      },
      {
        label: 'Stale',
        value: this.threads.filter(t => t.status === InteractionStatus.STALE).length,
        color: '#f59e0b'
      },
      {
        label: 'Closed',
        value: this.threads.filter(t => t.status === InteractionStatus.CLOSED).length,
        color: '#6b7280'
      }
    ];
  }
}
