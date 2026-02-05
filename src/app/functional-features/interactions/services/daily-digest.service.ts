import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { InteractionService } from './interaction.service';
import { InteractionThread, EventType, InteractionStatus } from '../models/interaction.model';

export interface DigestInsight {
  type: 'priority' | 'attention' | 'opportunity' | 'alert';
  icon: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}

export interface DailyDigest {
  date: Date;
  greeting: string;
  insights: DigestInsight[];
  stats: {
    activeConversations: number;
    interviewsScheduled: number;
    needsAttention: number;
    newThisWeek: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DailyDigestService {

  constructor(private interactionService: InteractionService) {}

  getDailyDigest(): Observable<DailyDigest> {
    return this.interactionService.getThreads().pipe(
      map(threads => this.generateDigest(threads))
    );
  }

  private generateDigest(threads: InteractionThread[]): DailyDigest {
    const insights: DigestInsight[] = [];
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const activeConversations = threads.filter(t => t.status === InteractionStatus.ACTIVE).length;
    const newThisWeek = threads.filter(t => new Date(t.createdAt).getTime() >= sevenDaysAgo).length;
    
    // Find interviews scheduled
    const interviewThreads = threads.filter(t => 
      t.events.some(e => e.eventType === EventType.INTERVIEW_INVITE)
    );
    
    if (interviewThreads.length > 0) {
      const names = interviewThreads.slice(0, 3).map(t => t.participantName).join(', ');
      insights.push({
        type: 'priority',
        icon: '🎯',
        message: `${interviewThreads.length} interview${interviewThreads.length > 1 ? 's' : ''} scheduled with ${names}${interviewThreads.length > 3 ? ' and others' : ''}`,
        actionUrl: '/interactions/messages'
      });
    }

    // Find stale conversations
    const staleThreads = threads.filter(t => {
      const daysSince = Math.floor((now - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return t.status === InteractionStatus.STALE || daysSince > 14;
    });

    if (staleThreads.length > 0) {
      const names = staleThreads.slice(0, 2).map(t => t.participantName).join(', ');
      insights.push({
        type: 'attention',
        icon: '⚠️',
        message: `${staleThreads.length} conversation${staleThreads.length > 1 ? 's' : ''} need follow-up: ${names}${staleThreads.length > 2 ? ' and others' : ''}`,
        actionUrl: '/interactions/analytics'
      });
    }

    // Find CV requests
    const cvRequestThreads = threads.filter(t => {
      const hasCvRequest = t.events.some(e => e.eventType === EventType.CV_REQUEST);
      const hasCvSubmission = t.events.some(e => e.eventType === EventType.CV_SUBMISSION);
      return hasCvRequest && !hasCvSubmission;
    });

    if (cvRequestThreads.length > 0) {
      const names = cvRequestThreads.map(t => t.participantName).join(', ');
      insights.push({
        type: 'alert',
        icon: '📄',
        message: `CV requested by ${names} - submit your latest version`,
        actionUrl: '/interactions/messages'
      });
    }

    // Find high-value recruiters (high response rate)
    const highValueRecruiters = threads.filter(t => {
      const recruiterResponses = t.events.filter(e => e.senderId !== 'current-user').length;
      const userMessages = t.events.filter(e => e.senderId === 'current-user').length;
      const responseRate = userMessages > 0 ? (recruiterResponses / userMessages) * 100 : 0;
      return responseRate > 90 && t.status === InteractionStatus.ACTIVE;
    });

    if (highValueRecruiters.length > 0 && insights.length < 4) {
      const recruiter = highValueRecruiters[0];
      insights.push({
        type: 'opportunity',
        icon: '✨',
        message: `${recruiter.participantName} (${recruiter.companyName || 'Company'}) has excellent response rate - high-value opportunity`,
        actionUrl: '/interactions/messages'
      });
    }

    // If new conversations this week
    if (newThisWeek > 0 && insights.length < 4) {
      insights.push({
        type: 'opportunity',
        icon: '📈',
        message: `${newThisWeek} new conversation${newThisWeek > 1 ? 's' : ''} started this week - momentum is building`,
        actionUrl: '/interactions/messages'
      });
    }

    // Default insight if nothing is happening
    if (insights.length === 0) {
      insights.push({
        type: 'opportunity',
        icon: '💼',
        message: `All caught up! ${activeConversations} active conversation${activeConversations !== 1 ? 's' : ''} in your pipeline`,
        actionUrl: '/interactions/messages'
      });
    }

    const needsAttention = threads.filter(t => {
      const daysSince = Math.floor((now - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7 && (t.status === InteractionStatus.ACTIVE || t.status === InteractionStatus.STALE);
    }).length;

    return {
      date: new Date(),
      greeting: this.getGreeting(),
      insights: insights.slice(0, 4), // Max 4 insights to keep it clean
      stats: {
        activeConversations,
        interviewsScheduled: interviewThreads.length,
        needsAttention,
        newThisWeek
      }
    };
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
