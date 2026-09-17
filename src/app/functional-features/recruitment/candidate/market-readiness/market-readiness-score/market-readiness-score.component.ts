import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap, timer } from 'rxjs';
import { CandidateClassBadgeComponent } from '../../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { MarketReadinessBreakdown } from '../../models/goal.model';
import { MarketReadinessService } from '../../services/market-readiness.service';
import { ScoreBreakdownComponent } from '../score-breakdown/score-breakdown.component';
import { NextStepsRecommendationComponent } from '../next-steps/next-steps-recommendation.component';
import { PointsHistoryComponent } from '../points-history/points-history.component';

@Component({
  selector: 'app-market-readiness-score',
  standalone: true,
  imports: [
    CommonModule,
    CandidateClassBadgeComponent,
    ScoreBreakdownComponent,
    NextStepsRecommendationComponent,
    PointsHistoryComponent
  ],
  templateUrl: './market-readiness-score.component.html',
  styleUrls: ['./market-readiness-score.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketReadinessScoreComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

  readonly breakdown = signal<MarketReadinessBreakdown | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastRefreshedAt = signal<Date | null>(null);

  readonly scoreHeadline = computed(() => {
    const value = this.breakdown();
    return value ? `${value.totalScore.toLocaleString()} points` : '0 points';
  });

  readonly tierSteps = computed(() => {
    const currentTier = this.breakdown()?.marketReadinessTier ?? 'BRONZE';
    const currentIndex = this.tierOrder.indexOf(currentTier);

    return this.tierOrder.map((tier, index) => ({
      tier,
      label: this.formatTierLabel(tier),
      isComplete: index < currentIndex,
      isCurrent: index === currentIndex,
      isUpcoming: index > currentIndex
    }));
  });

  readonly nextTierLabel = computed(() => {
    const currentTier = this.breakdown()?.marketReadinessTier ?? 'BRONZE';
    const currentIndex = this.tierOrder.indexOf(currentTier);

    if (currentIndex >= this.tierOrder.length - 1) {
      return 'Top tier reached';
    }

    return this.formatTierLabel(this.tierOrder[currentIndex + 1]);
  });

  private formatTierLabel(tier: string): string {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
  }

  constructor(private readonly marketReadinessService: MarketReadinessService) {}

  ngOnInit(): void {
    // Temporary polling fallback for the candidate market-readiness card.
    // This refresh strategy is still being evaluated; it may be replaced by a save-triggered refresh,
    // a websocket push, or another event-driven approach depending on the final architecture.
    // For now we keep the short 30s refresh as a pragmatic fallback for async backend recalculations,
    // delayed upstream updates, and multi-device/profile-edit scenarios. It should be revisited once the
    // platform grows and the cost of repeated polling becomes material (especially at 10k+ active users
    // and AWS egress costs).
    timer(0, 30000).pipe(
      tap(() => {
        if (!this.breakdown()) {
          this.loading.set(true);
        }
      }),
      switchMap(() =>
        this.marketReadinessService.getMyMarketReadiness().pipe(
          catchError(() => {
            this.error.set('Could not refresh your market readiness data. Please try again.');
            return of(null);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      if (data) {
        this.breakdown.set(data);
        this.error.set(null);
      }
      this.loading.set(false);
      this.lastRefreshedAt.set(new Date());
    });
  }

  refreshNow(): void {
    this.loading.set(true);
    this.marketReadinessService.getMyMarketReadiness().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.breakdown.set(data);
        this.error.set(null);
        this.lastRefreshedAt.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not refresh your market readiness data. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
