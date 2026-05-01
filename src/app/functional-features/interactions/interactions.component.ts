import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { InteractionService } from './services/interaction.service';
import { InteractionThread, InteractionEvent, ChannelType, EventType, InteractionStatus } from './models/interaction.model';

@Component({
  selector: 'app-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  newEventType: EventType = EventType.EXPLORATION;
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
    this.newEventType = EventType.EXPLORATION;
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
    const hasCvSubmission = this.selectedThread.events.some(e => e.eventType === EventType.CV_SUBMISSION);
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
