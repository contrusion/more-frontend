import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityService } from '../services/opportunity.service';
import { JobFeedItem } from '../models/opportunity.model';

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

  constructor(private readonly opportunityService: OpportunityService) {}

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

  apply(job: JobFeedItem): void {
    if (job.alreadyApplied || this.applyingId() === job.id) return;
    this.applyingId.set(job.id);
    this.opportunityService.apply(job.id).subscribe({
      next: () => {
        this.jobs.update(list =>
          list.map(j => j.id === job.id ? { ...j, alreadyApplied: true } : j)
        );
        this.applyingId.set(null);
      },
      error: () => {
        this.applyingId.set(null);
      }
    });
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
