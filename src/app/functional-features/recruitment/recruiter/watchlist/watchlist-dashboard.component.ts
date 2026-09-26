import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import {
  CandidateSearchService,
  RecruiterWatchProgressResponse,
  RecruiterWatchlistEntryResponse,
} from '../services/candidate-search.service';

@Component({
  selector: 'app-watchlist-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist-dashboard.component.html',
  styleUrl: './watchlist-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistDashboardComponent implements OnInit {
  entries = signal<RecruiterWatchlistEntryResponse[]>([]);
  progressByAlias = signal<Record<string, RecruiterWatchProgressResponse>>({});
  loading = signal(true);
  error = signal<string | null>(null);

  activeEntries = computed(() => this.entries());

  constructor(private readonly candidateSearchService: CandidateSearchService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.candidateSearchService.getMyWatchlist().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loadProgress(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load watchlist requests. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private loadProgress(entries: RecruiterWatchlistEntryResponse[]): void {
    if (entries.length === 0) {
      this.progressByAlias.set({});
      return;
    }

    const progressRequests = entries.reduce<Record<string, Observable<RecruiterWatchProgressResponse | null>>>(
      (acc, entry) => {
        acc[entry.candidateAlias] = this.candidateSearchService
          .getWatchProgress(entry.candidateAlias)
          .pipe(catchError(() => of(null)));
        return acc;
      },
      {}
    );

    forkJoin(progressRequests).subscribe((progressMap) => {
      const cleanMap = Object.entries(progressMap).reduce<Record<string, RecruiterWatchProgressResponse>>((acc, [alias, progress]) => {
        if (progress) {
          acc[alias] = progress;
        }
        return acc;
      }, {});
      this.progressByAlias.set(cleanMap);
    });
  }

  progressFor(alias: string): RecruiterWatchProgressResponse | null {
    return this.progressByAlias()[alias] ?? null;
  }

  watchReasonLabel(reason: RecruiterWatchlistEntryResponse['triggerReason']): string {
    if (!reason) {
      return 'Not specified';
    }

    return reason
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  daysUntilExpiry(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  progressBarWidth(percent: number): string {
    return `${Math.max(0, Math.min(100, percent))}%`;
  }
}
