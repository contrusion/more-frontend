import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OpportunityService } from '../services/opportunity.service';
import { JobFeedItem } from '../models/opportunity.model';

type OpportunityFilter = 'ALL' | 'MATCHED_ROLES' | 'NO_MATCH';

@Component({
  selector: 'app-opportunity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunity-feed.component.html',
  styleUrl: './opportunity-feed.component.css'
})
export class OpportunityFeedComponent implements OnInit {
  jobs = signal<JobFeedItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  applyingId = signal<string | null>(null);
  activeFilter = signal<OpportunityFilter>('ALL');
  readonly filterOptions: Array<{ label: string; value: OpportunityFilter }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Ready to Apply', value: 'MATCHED_ROLES' },
    { label: 'Needs Career Development', value: 'NO_MATCH' },
  ];
  readonly filteredJobs = computed(() => {
    const filter = this.activeFilter();
    const jobs = this.jobs();

    if (filter === 'MATCHED_ROLES') {
      return jobs.filter(job => !this.isBelowThreshold(job));
    }

    if (filter === 'NO_MATCH') {
      return jobs.filter(job => this.isBelowThreshold(job));
    }

    return jobs;
  });

  constructor(
    private readonly opportunityService: OpportunityService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.opportunityService.getFeed().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load job opportunities. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyFilter(value: OpportunityFilter): void {
    this.activeFilter.set(value);
  }

  apply(job: JobFeedItem): void {
    if (job.alreadyApplied || this.isBelowThreshold(job) || this.applyingId() === job.id) return;
    this.applyingId.set(job.id);
    this.opportunityService.apply(job.id).subscribe({
      next: () => {
        this.jobs.update(list =>
          list.map(j => j.id === job.id ? { ...j, alreadyApplied: true, applicationStatus: 'SUBMITTED' } : j)
        );
        this.applyingId.set(null);
      },
      error: () => {
        this.applyingId.set(null);
      }
    });
  }

  withdraw(job: JobFeedItem): void {
    if (!job.alreadyApplied || job.applicationStatus !== 'SUBMITTED' || this.applyingId() === job.id) return;
    this.applyingId.set(job.id);
    this.opportunityService.withdraw(job.id).subscribe({
      next: () => {
        this.jobs.update(list =>
          list.map(j => j.id === job.id ? { ...j, applicationStatus: 'WITHDRAWN' } : j)
        );
        this.applyingId.set(null);
      },
      error: () => {
        this.applyingId.set(null);
      }
    });
  }

  activateCareerPathway(job: JobFeedItem): void {
    if (this.applyingId() === job.id) return;
    void this.router.navigate(['/career-development/goals']);
  }

  isBelowThreshold(job: JobFeedItem): boolean {
    const score = job.matchScore ?? 0;
    const threshold = job.matchThreshold ?? 80;
    return score < threshold;
  }

  formatJobType(type: string): string {
    return type?.replace(/_/g, ' ') ?? '';
  }

  formatExperience(level: string): string {
    return level?.replace(/_/g, ' ') ?? '';
  }

  formatSalary(min?: number, max?: number, currency?: string): string {
    if (!min && !max) return '';
    const c = currency ?? 'ZAR';
    if (min && max) return `${c} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min) return `From ${c} ${min.toLocaleString()}`;
    return `Up to ${c} ${max!.toLocaleString()}`;
  }
}
