import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { InteractionThread, InteractionEvent, CreateEventRequest, ChannelType, EventType, InteractionStatus } from '../models/interaction.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private apiUrl = `${environment.apiUrl}/api/interactions`;
  private threadsSubject = new BehaviorSubject<InteractionThread[]>([]);
  public threads$ = this.threadsSubject.asObservable();
  private isLoaded = false;
  private isLoading = false;

  constructor(private http: HttpClient) {}

  // Clear cache and force reload on next getThreads() call
  clearCache(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.threadsSubject.next([]);
  }

  // Get all interaction threads for the current user (cached)
  getThreads(): Observable<InteractionThread[]> {
    // Return cached data if already loaded
    if (this.isLoaded) {
      return this.threads$;
    }

    // If currently loading, return the observable to share the same request
    if (this.isLoading) {
      return this.threads$;
    }

    // Load data for the first time
    return this.refreshThreads();
  }

  // Force refresh threads from backend
  refreshThreads(): Observable<InteractionThread[]> {
    this.isLoading = true;
    
    // Add cache-busting parameter to force fresh data
    const cacheBuster = `?_=${new Date().getTime()}`;
    
    return this.http.get<any[]>(`${this.apiUrl}${cacheBuster}`).pipe(
      map(interactions => interactions.map(dto => this.mapToThread(dto))),
      tap(threads => {
        this.threadsSubject.next(threads);
        this.isLoaded = true;
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error fetching interaction threads:', error);
        this.isLoading = false;
        return of([]);
      })
    );
  }
  
  /**
   * Map backend RecruiterInteractionDto to frontend InteractionThread model
   */
  private mapToThread(dto: any): InteractionThread {
    const events = (dto.interactionEventDtos || [])
      .map((e: any) => {
        // Determine sender based on event type
        const isUserSent = this.isUserSentEvent(e.type);
        
        return {
          id: e.id,
          interactionThreadId: dto.id,
          eventType: this.mapEventType(e.type),
          channel: this.mapChannel(e.channel),
          content: e.messagePreview || e.notes || '',
          timestamp: new Date(e.timestamp),
          senderId: isUserSent ? 'current-user' : (dto.externalRecruiterEmail || dto.recruiter?.email || 'recruiter'),
          senderName: isUserSent ? 'You' : (dto.externalRecruiterName || dto.recruiter?.name || 'Recruiter'),
          metadata: {
            personalizationLevel: e.personalized ? 80 : 20,
            containsUrgencyCue: e.containsUrgencyCue
          }
        };
      })
      .sort((a: InteractionEvent, b: InteractionEvent) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort chronologically
    
    const lastEvent = events[events.length - 1];
    
    return {
      id: dto.id,
      participantId: dto.recruiter?.id || dto.externalRecruiterEmail || 'external',
      participantName: dto.externalRecruiterName || dto.recruiter?.name || dto.externalRecruiterEmail || 'Unknown Recruiter',
      participantRole: 'RECRUITER',
      companyName: dto.externalCompanyName || dto.recruiter?.company || undefined,
      jobTitle: this.extractJobTitle(events),
      status: this.mapStatus(dto.status),
      lastEventDate: lastEvent?.timestamp || new Date(dto.initiatedAt),
      lastEventPreview: lastEvent?.content || 'No messages yet',
      unreadCount: 0, // TODO: Implement unread tracking
      createdAt: new Date(dto.initiatedAt),
      updatedAt: new Date(dto.initiatedAt),
      events: events
    };
  }
  
  /**
   * Determine if an event was sent by the user based on event type
   */
  private isUserSentEvent(eventType: string): boolean {
    const userSentTypes = ['REPLY', 'CV_SUBMISSION'];
    return userSentTypes.includes(eventType);
  }
  
  private mapEventType(backendType: string): EventType {
    const mapping: Record<string, EventType> = {
      'JOB_OPPORTUNITY': EventType.OUTREACH,
      'CV_REQUEST': EventType.CV_REQUEST,
      'INTERVIEW_INVITE': EventType.INTERVIEW_INVITE,
      'FOLLOW_UP': EventType.FOLLOW_UP,
      'REJECTION': EventType.FOLLOW_UP,
      'OTHER': EventType.EXPLORATION
    };
    return mapping[backendType] || EventType.EXPLORATION;
  }
  
  private mapChannel(backendChannel: string): ChannelType {
    const mapping: Record<string, ChannelType> = {
      'EMAIL': ChannelType.EMAIL,
      'LINKEDIN': ChannelType.LINKEDIN,
      'PHONE': ChannelType.PHONE,
      'WHATSAPP': ChannelType.WHATSAPP,
      'IN_PERSON': ChannelType.IN_PERSON,
      'SMS': ChannelType.TEXT_MESSAGE,
      'MO_NATIVE': ChannelType.MO_NATIVE
    };
    return mapping[backendChannel] || ChannelType.OTHER;
  }
  
  private mapStatus(backendStatus: string): InteractionStatus {
    const mapping: Record<string, InteractionStatus> = {
      'NEW': InteractionStatus.NEW,
      'ACTIVE': InteractionStatus.ACTIVE,
      'STALE': InteractionStatus.STALE,
      'CLOSED': InteractionStatus.CLOSED
    };
    return mapping[backendStatus] || InteractionStatus.NEW;
  }
  
  private extractJobTitle(events: InteractionEvent[]): string | undefined {
    // Try to extract job title from event content
    for (const event of events) {
      const match = event.content.match(/(?:for|about|regarding)\s+(?:a|an|the)?\s*([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Architect))/);
      if (match) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  // DEPRECATED: Get all interaction threads - mock data version  
  getThreadsOld(): Observable<InteractionThread[]> {
    // TODO: Replace with actual API call
    // return this.http.get<InteractionThread[]>(`${this.apiUrl}/threads`).pipe(
    //   tap(threads => this.threadsSubject.next(threads))
    // );
    return this.threads$;
  }

  // Get a specific thread by ID
  getThread(threadId: string): Observable<InteractionThread | undefined> {
    // TODO: Replace with actual API call
    // return this.http.get<InteractionThread>(`${this.apiUrl}/threads/${threadId}`);
    return this.threads$.pipe(
      map(threads => threads.find(t => t.id === threadId))
    );
  }

  // Create a new event (manual log or native message)
  createEvent(request: CreateEventRequest): Observable<InteractionEvent> {
    // TODO: Replace with actual API call
    // return this.http.post<InteractionEvent>(`${this.apiUrl}/events`, request);
    
    // Mock implementation
    const newEvent: InteractionEvent = {
      id: Math.random().toString(36).substr(2, 9),
      interactionThreadId: request.interactionThreadId || '',
      eventType: request.eventType,
      channel: request.channel,
      content: request.content,
      timestamp: new Date(),
      senderId: 'current-user',
      senderName: 'You',
      metadata: request.metadata
    };

    return of(newEvent);
  }

  // Update thread status
  updateThreadStatus(threadId: string, status: InteractionStatus): Observable<void> {
    // TODO: Replace with actual API call
    // return this.http.patch<void>(`${this.apiUrl}/threads/${threadId}/status`, { status });
    return of(void 0);
  }

  // Mark thread as read
  markAsRead(threadId: string): Observable<void> {
    // TODO: Replace with actual API call
    // return this.http.post<void>(`${this.apiUrl}/threads/${threadId}/read`, {});
    
    const threads = this.threadsSubject.value;
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.unreadCount = 0;
      this.threadsSubject.next([...threads]);
    }
    return of(void 0);
  }

  // Search/filter threads
  searchThreads(query: string): Observable<InteractionThread[]> {
    return this.threads$.pipe(
      map(threads => threads.filter(thread =>
        thread.participantName.toLowerCase().includes(query.toLowerCase()) ||
        thread.jobTitle?.toLowerCase().includes(query.toLowerCase()) ||
        thread.companyName?.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }

  // Filter by status
  filterByStatus(status: InteractionStatus): Observable<InteractionThread[]> {
    return this.threads$.pipe(
      map(threads => threads.filter(thread => thread.status === status))
    );
  }

  // Load mock data for development
  private loadMockData(): void {
    const mockThreads: InteractionThread[] = [
      {
        id: '1',
        participantId: 'recruiter-1',
        participantName: 'Sarah Johnson',
        participantRole: 'RECRUITER',
        companyName: 'TechCorp Ltd',
        jobTitle: 'Senior Frontend Developer',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastEventPreview: 'Thanks for your interest! When would be a good time to chat?',
        unreadCount: 2,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        events: [
          {
            id: 'e1',
            interactionThreadId: '1',
            eventType: EventType.OUTREACH,
            channel: ChannelType.LINKEDIN,
            content: 'Hi! I saw your profile and think you\'d be a great fit for our Senior Frontend Developer role.',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-1',
            senderName: 'Sarah Johnson'
          },
          {
            id: 'e2',
            interactionThreadId: '1',
            eventType: EventType.REPLY,
            channel: ChannelType.LINKEDIN,
            content: 'Thanks for reaching out! I\'m interested. Could you share more details about the role?',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            senderId: 'current-user',
            senderName: 'You'
          },
          {
            id: 'e3',
            interactionThreadId: '1',
            eventType: EventType.EXPLORATION,
            channel: ChannelType.MO_NATIVE,
            content: 'Thanks for your interest! When would be a good time to chat?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            senderId: 'recruiter-1',
            senderName: 'Sarah Johnson'
          }
        ]
      },
      {
        id: '2',
        participantId: 'recruiter-2',
        participantName: 'Michael Chen',
        participantRole: 'RECRUITER',
        companyName: 'StartupXYZ',
        jobTitle: 'Full Stack Engineer',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Could you send over your latest CV?',
        unreadCount: 0,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e4',
            interactionThreadId: '2',
            eventType: EventType.OUTREACH,
            channel: ChannelType.EMAIL,
            content: 'We have an exciting opportunity for a Full Stack Engineer at our startup.',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-2',
            senderName: 'Michael Chen'
          },
          {
            id: 'e5',
            interactionThreadId: '2',
            eventType: EventType.CV_REQUEST,
            channel: ChannelType.EMAIL,
            content: 'Could you send over your latest CV?',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-2',
            senderName: 'Michael Chen'
          }
        ]
      },
      {
        id: '3',
        participantId: 'recruiter-3',
        participantName: 'Emma Williams',
        participantRole: 'RECRUITER',
        companyName: 'Global Solutions Inc',
        status: InteractionStatus.STALE,
        lastEventDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Just wanted to follow up on my previous message...',
        unreadCount: 0,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e6',
            interactionThreadId: '3',
            eventType: EventType.OUTREACH,
            channel: ChannelType.WHATSAPP,
            content: 'Hi, I got your number from LinkedIn. Are you open to new opportunities?',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-3',
            senderName: 'Emma Williams'
          },
          {
            id: 'e7',
            interactionThreadId: '3',
            eventType: EventType.FOLLOW_UP,
            channel: ChannelType.WHATSAPP,
            content: 'Just wanted to follow up on my previous message...',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-3',
            senderName: 'Emma Williams'
          }
        ]
      },
      {
        id: '4',
        participantId: 'recruiter-4',
        participantName: 'David Martinez',
        participantRole: 'RECRUITER',
        companyName: 'Innovation Labs',
        jobTitle: 'Backend Developer',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Looking forward to hearing from you!',
        unreadCount: 1,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e8',
            interactionThreadId: '4',
            eventType: EventType.OUTREACH,
            channel: ChannelType.EMAIL,
            content: 'We\'re hiring for a Backend Developer position. Interested?',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-4',
            senderName: 'David Martinez'
          },
          {
            id: 'e9',
            interactionThreadId: '4',
            eventType: EventType.FOLLOW_UP,
            channel: ChannelType.EMAIL,
            content: 'Looking forward to hearing from you!',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-4',
            senderName: 'David Martinez'
          }
        ]
      },
      {
        id: '5',
        participantId: 'recruiter-5',
        participantName: 'Rachel Anderson',
        participantRole: 'RECRUITER',
        companyName: 'CloudTech Solutions',
        jobTitle: 'Cloud Architect',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'We\'d love to schedule an interview. What does your calendar look like?',
        unreadCount: 1,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e10',
            interactionThreadId: '5',
            eventType: EventType.OUTREACH,
            channel: ChannelType.LINKEDIN,
            content: 'Your cloud expertise is impressive! We have a Cloud Architect role.',
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-5',
            senderName: 'Rachel Anderson'
          },
          {
            id: 'e11',
            interactionThreadId: '5',
            eventType: EventType.INTERVIEW_INVITE,
            channel: ChannelType.EMAIL,
            content: 'We\'d love to schedule an interview. What does your calendar look like?',
            timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-5',
            senderName: 'Rachel Anderson'
          }
        ]
      },
      {
        id: '6',
        participantId: 'recruiter-6',
        participantName: 'James Taylor',
        participantRole: 'RECRUITER',
        companyName: 'FinTech Innovations',
        jobTitle: 'Security Engineer',
        status: InteractionStatus.STALE,
        lastEventDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Still interested in the Security Engineer position?',
        unreadCount: 0,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e12',
            interactionThreadId: '6',
            eventType: EventType.OUTREACH,
            channel: ChannelType.PHONE,
            content: 'Called regarding Security Engineer role at FinTech Innovations',
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-6',
            senderName: 'James Taylor'
          },
          {
            id: 'e13',
            interactionThreadId: '6',
            eventType: EventType.FOLLOW_UP,
            channel: ChannelType.EMAIL,
            content: 'Still interested in the Security Engineer position?',
            timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-6',
            senderName: 'James Taylor'
          }
        ]
      },
      {
        id: '7',
        participantId: 'recruiter-7',
        participantName: 'Lisa Park',
        participantRole: 'RECRUITER',
        companyName: 'Data Analytics Corp',
        jobTitle: 'Data Engineer',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Can we set up a call to discuss the Data Engineer opportunity?',
        unreadCount: 1,
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e14',
            interactionThreadId: '7',
            eventType: EventType.OUTREACH,
            channel: ChannelType.LINKEDIN,
            content: 'Your data engineering background is exactly what we\'re looking for!',
            timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-7',
            senderName: 'Lisa Park'
          },
          {
            id: 'e15',
            interactionThreadId: '7',
            eventType: EventType.EXPLORATION,
            channel: ChannelType.VIDEO_CALL,
            content: 'Can we set up a call to discuss the Data Engineer opportunity?',
            timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-7',
            senderName: 'Lisa Park'
          }
        ]
      },
      {
        id: '8',
        participantId: 'recruiter-8',
        participantName: 'Tom Wilson',
        participantRole: 'RECRUITER',
        companyName: 'Mobile First Inc',
        jobTitle: 'Mobile Developer',
        status: InteractionStatus.STALE,
        lastEventDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Following up on the Mobile Developer role',
        unreadCount: 0,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e16',
            interactionThreadId: '8',
            eventType: EventType.OUTREACH,
            channel: ChannelType.TEXT_MESSAGE,
            content: 'Hey! Found your profile. We\'re hiring mobile developers.',
            timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-8',
            senderName: 'Tom Wilson'
          },
          {
            id: 'e17',
            interactionThreadId: '8',
            eventType: EventType.FOLLOW_UP,
            channel: ChannelType.EMAIL,
            content: 'Following up on the Mobile Developer role',
            timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-8',
            senderName: 'Tom Wilson'
          }
        ]
      },
      {
        id: '9',
        participantId: 'recruiter-9',
        participantName: 'Maria Garcia',
        participantRole: 'RECRUITER',
        companyName: 'AI Research Labs',
        jobTitle: 'Machine Learning Engineer',
        status: InteractionStatus.ACTIVE,
        lastEventDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        lastEventPreview: 'Would you be available for a quick chat this week?',
        unreadCount: 1,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        events: [
          {
            id: 'e18',
            interactionThreadId: '9',
            eventType: EventType.OUTREACH,
            channel: ChannelType.EMAIL,
            content: 'We\'re building an amazing ML team and would love to have you!',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-9',
            senderName: 'Maria Garcia'
          },
          {
            id: 'e19',
            interactionThreadId: '9',
            eventType: EventType.EXPLORATION,
            channel: ChannelType.MO_NATIVE,
            content: 'Would you be available for a quick chat this week?',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            senderId: 'recruiter-9',
            senderName: 'Maria Garcia'
          }
        ]
      }
    ];

    this.threadsSubject.next(mockThreads);
  }
}
