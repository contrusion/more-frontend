import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CandidateSearchService,
  CandidateWatchRequestResponse,
} from '../services/candidate-search.service';

type WatchStatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

@Component({
  selector: 'app-watchlist-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist-dashboard.component.html',
  styleUrl: './watchlist-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistDashboardComponent implements OnInit {
  requests = signal<CandidateWatchRequestResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  statusFilter = signal<WatchStatusFilter>('ALL');

  filteredRequests = computed(() => {
    const filter = this.statusFilter();
    const allRequests = this.requests();
    if (filter === 'ALL') {
      return allRequests;
    }
    return allRequests.filter((request) => request.status === filter);
  });

  statusCounts = computed(() => {
    const allRequests = this.requests();
    return {
      all: allRequests.length,
      pending: allRequests.filter((request) => request.status === 'PENDING').length,
      accepted: allRequests.filter((request) => request.status === 'ACCEPTED').length,
      declined: allRequests.filter((request) => request.status === 'DECLINED').length,
      expired: allRequests.filter((request) => request.status === 'EXPIRED').length,
    };
  });

  constructor(private readonly candidateSearchService: CandidateSearchService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.candidateSearchService.getMyWatchRequests().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load watchlist requests. Please try again.');
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(filter: WatchStatusFilter): void {
    this.statusFilter.set(filter);
  }

  watchReasonLabel(reason: CandidateWatchRequestResponse['triggerReason']): string {
    return reason
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  statusLabel(status: CandidateWatchRequestResponse['status']): string {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  statusClass(status: CandidateWatchRequestResponse['status']): string {
    switch (status) {
      case 'PENDING':
        return 'watch-status watch-status--pending';
      case 'ACCEPTED':
        return 'watch-status watch-status--accepted';
      case 'DECLINED':
        return 'watch-status watch-status--declined';
      case 'EXPIRED':
        return 'watch-status watch-status--expired';
      default:
        return 'watch-status';
    }
  }

  daysUntilExpiry(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
