import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CandidateChallengeService } from '../candidate-challenge.service';
import { CandidateChallengeView, ChallengeProofSubmissionRequest, ChallengeUserStatus } from '../challenge.model';
import { ChallengeCardComponent } from '../challenge-card/challenge-card.component';
import { ChallengeStreakTrackerComponent } from '../challenge-streak-tracker/challenge-streak-tracker.component';

type StatusFilter = 'ALL' | ChallengeUserStatus;

@Component({
  selector: 'app-challenge-feed',
  standalone: true,
  imports: [ButtonModule, ChallengeCardComponent, ChallengeStreakTrackerComponent],
  templateUrl: './challenge-feed.component.html',
  styleUrls: ['./challenge-feed.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeFeedComponent implements OnInit {
  private readonly service = inject(CandidateChallengeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly challenges = signal<CandidateChallengeView[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly enrolingId = signal<string | null>(null);
  readonly submittingProofId = signal<string | null>(null);

  readonly filteredChallenges = computed(() => {
    const all = this.challenges();
    const filter = this.statusFilter();
    if (filter === 'ALL') return all;
    if (filter === 'AVAILABLE') return all.filter(c => c.enrolmentStatus === null);
    return all.filter(c => c.enrolmentStatus === filter);
  });

  readonly inProgressChallenges = computed(() =>
    this.challenges().filter(c => c.enrolmentStatus === 'IN_PROGRESS'));

  readonly completedChallenges = computed(() =>
    this.challenges().filter(c => c.enrolmentStatus === 'COMPLETED'));

  readonly availableChallenges = computed(() =>
    this.challenges().filter(c => c.enrolmentStatus === null));

  readonly totalPoints = computed(() =>
    this.challenges().reduce((sum, c) => sum + (c.pointsAwarded ?? 0), 0));

  readonly filterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAvailableChallenges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: challenges => {
          this.challenges.set(challenges);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load challenges. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onEnrol(challengeId: string): void {
    this.enrolingId.set(challengeId);
    this.service.enrol(challengeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.challenges.update(list =>
            list.map(c => c.id === updated.id ? updated : c)
          );
          this.enrolingId.set(null);
        },
        error: () => this.enrolingId.set(null)
      });
  }

  onSubmitProof(event: { challengeId: string; request: ChallengeProofSubmissionRequest }): void {
    this.submittingProofId.set(event.challengeId);
    this.service.submitProof(event.challengeId, event.request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.challenges.update(list =>
            list.map(c => c.id === updated.id ? updated : c)
          );
          this.submittingProofId.set(null);
        },
        error: () => this.submittingProofId.set(null)
      });
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }
}
