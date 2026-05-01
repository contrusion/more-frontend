import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface RecruiterOpportunity {
  id: string;
  recruiterName: string;
  recruiterCompany: string;
  recruiterLinkedIn?: string;
  lastContactDate: Date;
  roleTitles: string[];
  techStack: string[];
  location: string;
  remote: boolean;
  salaryRange?: string;
  rejectionReason: string;
  matchScore: number;
  conversationId: string;
}

@Component({
  selector: 'app-reconnection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reconnection.component.html',
  styleUrls: ['./reconnection.component.css']
})
export class ReconnectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Mock data for now - will be replaced with actual service
  opportunities: RecruiterOpportunity[] = [
    {
      id: '1',
      recruiterName: 'Sarah Johnson',
      recruiterCompany: 'TechRecruit Solutions',
      recruiterLinkedIn: 'https://linkedin.com/in/sarahjohnson',
      lastContactDate: new Date('2025-06-15'),
      roleTitles: ['Senior Full Stack Engineer', 'Lead Developer'],
      techStack: ['Angular', 'C#', '.NET Core', 'Azure', 'SQL Server'],
      location: 'Remote',
      remote: true,
      salaryRange: '$120k - $150k',
      rejectionReason: 'Not actively looking at the time',
      matchScore: 95,
      conversationId: 'conv-123'
    },
    {
      id: '2',
      recruiterName: 'Michael Chen',
      recruiterCompany: 'Elite Tech Staffing',
      lastContactDate: new Date('2025-08-20'),
      roleTitles: ['Full Stack Developer'],
      techStack: ['React', 'Node.js', 'TypeScript', 'AWS'],
      location: 'San Francisco, CA',
      remote: false,
      salaryRange: '$130k - $160k',
      rejectionReason: 'Location did not match',
      matchScore: 72,
      conversationId: 'conv-124'
    },
    {
      id: '3',
      recruiterName: 'Emily Rodriguez',
      recruiterCompany: 'Innovation Partners',
      recruiterLinkedIn: 'https://linkedin.com/in/emilyrodriguez',
      lastContactDate: new Date('2025-07-10'),
      roleTitles: ['Senior Software Engineer', 'Tech Lead'],
      techStack: ['Angular', 'TypeScript', 'C#', 'Azure', 'Microservices'],
      location: 'Remote',
      remote: true,
      salaryRange: '$140k - $170k',
      rejectionReason: 'Tech stack was not fully aligned',
      matchScore: 88,
      conversationId: 'conv-125'
    }
  ];

  filteredOpportunities: RecruiterOpportunity[] = [];
  selectedTimeframe: string = '6months';
  minMatchScore: number = 70;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    const now = new Date();
    const timeframeMonths = this.getTimeframeMonths(this.selectedTimeframe);
    const cutoffDate = new Date(now.setMonth(now.getMonth() - timeframeMonths));

    this.filteredOpportunities = this.opportunities
      .filter(opp => opp.lastContactDate >= cutoffDate)
      .filter(opp => opp.matchScore >= this.minMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  getTimeframeMonths(timeframe: string): number {
    switch (timeframe) {
      case '3months': return 3;
      case '6months': return 6;
      case '12months': return 12;
      case '24months': return 24;
      default: return 6;
    }
  }

  onTimeframeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTimeframe = target.value;
    this.applyFilters();
  }

  onMatchScoreChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.minMatchScore = parseInt(target.value);
    this.applyFilters();
  }

  getMatchScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'low';
  }

  viewConversation(conversationId: string): void {
    // Navigate to the specific conversation in events
    this.router.navigate(['/interactions/events'], { 
      queryParams: { conversation: conversationId } 
    });
  }

  generateTemplate(opportunity: RecruiterOpportunity): void {
    // TODO: Implement AI template generation
    console.log('Generating template for:', opportunity);
  }

  getMonthsAgo(date: Date): string {
    const now = new Date();
    const months = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months === 0) return 'This month';
    if (months === 1) return '1 month ago';
    return `${months} months ago`;
  }
}
