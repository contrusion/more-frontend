import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { InteractionService } from '../services/interaction.service';
import { InteractionThread, ChannelType, EventType, InteractionStatus } from '../models/interaction.model';

@Component({
  selector: 'app-interactions-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interactions-analytics.component.html',
  styleUrls: ['./interactions-analytics.component.css']
})
export class InteractionsAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  threads: InteractionThread[] = [];
  
  constructor(private interactionService: InteractionService) {}

  ngOnInit(): void {
    this.interactionService.getThreads()
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => {
        this.threads = threads;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== PIPELINE STATS ==========
  
  getPipelineStats(): { label: string, value: number, color: string, percentage: number }[] {
    const total = this.threads.length || 1;
    return [
      {
        label: 'New',
        value: this.threads.filter(t => t.status === InteractionStatus.NEW).length,
        color: '#0ea5e9',
        percentage: Math.round((this.threads.filter(t => t.status === InteractionStatus.NEW).length / total) * 100)
      },
      {
        label: 'Active',
        value: this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length,
        color: '#10b981',
        percentage: Math.round((this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length / total) * 100)
      },
      {
        label: 'Stale',
        value: this.threads.filter(t => t.status === InteractionStatus.STALE).length,
        color: '#f59e0b',
        percentage: Math.round((this.threads.filter(t => t.status === InteractionStatus.STALE).length / total) * 100)
      },
      {
        label: 'Closed',
        value: this.threads.filter(t => t.status === InteractionStatus.CLOSED).length,
        color: '#6b7280',
        percentage: Math.round((this.threads.filter(t => t.status === InteractionStatus.CLOSED).length / total) * 100)
      }
    ];
  }

  // ========== CHANNEL ANALYTICS ==========
  
  getChannelStats(): { channel: ChannelType, count: number, percentage: number, color: string }[] {
    if (!this.threads.length) return [];
    
    const channelCounts = new Map<ChannelType, number>();
    let totalEvents = 0;
    
    this.threads.forEach(thread => {
      thread.events.forEach(event => {
        channelCounts.set(event.channel, (channelCounts.get(event.channel) || 0) + 1);
        totalEvents++;
      });
    });
    
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
    
    return Array.from(channelCounts.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: Math.round((count / totalEvents) * 100),
        color: colors[channel]
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ========== EVENT TYPE BREAKDOWN ==========
  
  getEventTypeStats(): { eventType: EventType, count: number, percentage: number }[] {
    if (!this.threads.length) return [];
    
    const eventTypeCounts = new Map<EventType, number>();
    let totalEvents = 0;
    
    this.threads.forEach(thread => {
      thread.events.forEach(event => {
        eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1);
        totalEvents++;
      });
    });
    
    return Array.from(eventTypeCounts.entries())
      .map(([eventType, count]) => ({
        eventType,
        count,
        percentage: Math.round((count / totalEvents) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ========== RESPONSE ANALYTICS ==========
  
  getAverageResponseTime(): string {
    if (!this.threads.length) return 'N/A';
    
    let totalHours = 0;
    let responseCount = 0;
    
    this.threads.forEach(thread => {
      for (let i = 1; i < thread.events.length; i++) {
        const current = new Date(thread.events[i].timestamp);
        const previous = new Date(thread.events[i - 1].timestamp);
        const diffHours = (current.getTime() - previous.getTime()) / (1000 * 60 * 60);
        totalHours += diffHours;
        responseCount++;
      }
    });
    
    if (responseCount === 0) return 'N/A';
    
    const avgHours = totalHours / responseCount;
    if (avgHours < 1) return `${Math.round(avgHours * 60)} mins`;
    if (avgHours < 24) return `${Math.round(avgHours)} hours`;
    return `${Math.round(avgHours / 24)} days`;
  }

  getOverallResponseRate(): number {
    if (!this.threads.length) return 0;
    
    let recruiterResponses = 0;
    let userMessages = 0;
    
    this.threads.forEach(thread => {
      recruiterResponses += thread.events.filter(e => e.senderId !== 'current-user').length;
      userMessages += thread.events.filter(e => e.senderId === 'current-user').length;
    });
    
    if (userMessages === 0) return 0;
    return Math.round((recruiterResponses / userMessages) * 100);
  }

  // ========== ACTIVITY METRICS ==========
  
  getTotalInteractions(): number {
    return this.threads.length;
  }

  getTotalEvents(): number {
    return this.threads.reduce((sum, thread) => sum + thread.events.length, 0);
  }

  getActiveThreadsCount(): number {
    return this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length;
  }

  getInactiveConversationsCount(): number {
    return this.threads.filter(t => {
      const daysSince = Math.floor((Date.now() - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return t.status === InteractionStatus.STALE || daysSince > 7;
    }).length;
  }

  getNewThisWeekCount(): number {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.threads.filter(t => new Date(t.createdAt).getTime() >= sevenDaysAgo).length;
  }

  getNeedsAttentionCount(): number {
    return this.threads.filter(t => {
      const daysSince = Math.floor((Date.now() - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7 && (t.status === InteractionStatus.ACTIVE || t.status === InteractionStatus.STALE);
    }).length;
  }

  // ========== TOP PERFORMERS ==========
  
  getTopRecruiters(): { name: string, company: string, interactions: number, responseRate: number }[] {
    const recruiterMap = new Map<string, { name: string, company: string, threads: InteractionThread[] }>();
    
    this.threads.forEach(thread => {
      if (!recruiterMap.has(thread.participantId)) {
        recruiterMap.set(thread.participantId, {
          name: thread.participantName,
          company: thread.companyName || '',
          threads: []
        });
      }
      recruiterMap.get(thread.participantId)!.threads.push(thread);
    });
    
    return Array.from(recruiterMap.values())
      .map(recruiter => {
        let recruiterResponses = 0;
        let userMessages = 0;
        
        recruiter.threads.forEach(thread => {
          recruiterResponses += thread.events.filter(e => e.senderId !== 'current-user').length;
          userMessages += thread.events.filter(e => e.senderId === 'current-user').length;
        });
        
        return {
          name: recruiter.name,
          company: recruiter.company,
          interactions: recruiter.threads.length,
          responseRate: userMessages > 0 ? Math.round((recruiterResponses / userMessages) * 100) : 0
        };
      })
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 5);
  }

  // ========== ALERTS ==========
  
  getAlerts(): { type: 'warning' | 'info' | 'success', message: string }[] {
    const alerts: { type: 'warning' | 'info' | 'success', message: string }[] = [];
    
    const needsAttention = this.getNeedsAttentionCount();
    if (needsAttention > 0) {
      alerts.push({
        type: 'warning',
        message: `${needsAttention} conversation${needsAttention > 1 ? 's' : ''} inactive for 7+ days - follow-up recommended`
      });
    }
    
    const activeCount = this.getActiveThreadsCount();
    if (activeCount > 10) {
      alerts.push({
        type: 'success',
        message: `Excellent engagement! ${activeCount} active conversations in your pipeline`
      });
    }
    
    return alerts;
  }

  // ========== CONVERSATIONS NEEDING ATTENTION ==========
  
  getConversationsNeedingFollowup(): { 
    participantName: string, 
    company: string, 
    daysSinceLastActivity: number, 
    status: InteractionStatus,
    threadId: string,
    urgency: 'critical' | 'high' | 'medium'
  }[] {
    return this.threads
      .filter(thread => {
        const daysSince = Math.floor((Date.now() - new Date(thread.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 3 && (thread.status === InteractionStatus.ACTIVE || thread.status === InteractionStatus.STALE);
      })
      .map(thread => {
        const daysSince = Math.floor((Date.now() - new Date(thread.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
        let urgency: 'critical' | 'high' | 'medium';
        
        if (thread.status === InteractionStatus.STALE || daysSince > 14) {
          urgency = 'critical';
        } else if (daysSince > 7) {
          urgency = 'high';
        } else {
          urgency = 'medium';
        }
        
        return {
          participantName: thread.participantName,
          company: thread.companyName || 'N/A',
          daysSinceLastActivity: daysSince,
          status: thread.status,
          threadId: thread.id,
          urgency
        };
      })
      .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
  }
}
