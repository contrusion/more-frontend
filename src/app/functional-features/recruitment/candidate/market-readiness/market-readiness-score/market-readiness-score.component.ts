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
  private readonly tierRoleExamples: Record<string, Array<{ title: string; level: string; note: string }>> = {
    SILVER: [
      { title: 'Junior Product Analyst', level: 'Junior', note: 'Strong fit from profile and baseline skills' },
      { title: 'Operations Coordinator', level: 'Junior', note: 'Good fit with process and delivery exposure' },
      { title: 'Support Specialist', level: 'Junior', note: 'Good launch role while building depth' }
    ],
    GOLD: [
      { title: 'Product Analyst', level: 'Mid', note: 'Likely next step with stronger execution signals' },
      { title: 'Project Coordinator', level: 'Mid', note: 'Fits mixed planning and stakeholder strengths' },
      { title: 'Business Operations Associate', level: 'Mid', note: 'Good match with structured delivery trajectory' }
    ],
    PLATINUM: [
      { title: 'Senior Product Analyst', level: 'Senior', note: 'Unlocked by sustained quality and impact' },
      { title: 'Program Manager', level: 'Senior', note: 'Best fit when cross-functional depth is consistent' },
      { title: 'Strategy & Operations Lead', level: 'Senior', note: 'Potential role if leadership evidence strengthens' }
    ]
  };
  private readonly categoryLabels: Record<string, string> = {
    PROFILE: 'Profile strength',
    CAREER_DEPTH: 'Career depth',
    CERTIFICATIONS: 'Certifications',
    SKILLS: 'Skills',
    EXPERIENCE: 'Experience'
  };

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

  readonly primaryNextStep = computed(() => this.breakdown()?.nextSteps[0] ?? null);

  readonly leadingCategory = computed(() => {
    const categories = this.breakdown()?.categories.filter((item) => item.category !== 'TOTAL') ?? [];

    if (categories.length === 0) {
      return null;
    }

    const bestCategory = categories.reduce((best, current) => {
      const bestRatio = best.maxPoints === 0 ? 0 : best.earnedPoints / best.maxPoints;
      const currentRatio = current.maxPoints === 0 ? 0 : current.earnedPoints / current.maxPoints;
      return currentRatio > bestRatio ? current : best;
    });

    const percent = bestCategory.maxPoints === 0
      ? 0
      : Math.round((bestCategory.earnedPoints / bestCategory.maxPoints) * 100);

    return {
      label: this.categoryLabel(bestCategory.category),
      earnedPoints: bestCategory.earnedPoints,
      maxPoints: bestCategory.maxPoints,
      percent
    };
  });

  readonly readinessNarrative = computed(() => {
    const value = this.breakdown();

    if (!value) {
      return 'Track your current tier, score contributors, and your highest-impact next actions.';
    }

    if (value.pointsToNextTier <= 0) {
      return `You are currently in ${this.formatTierLabel(value.marketReadinessTier)} and have reached the top threshold.`;
    }

    return `${value.pointsToNextTier.toLocaleString()} points separate you from ${this.nextTierLabel()}, with your next step likely coming from focused profile or capability improvements.`;
  });

  readonly nextTierExamplePositions = computed(() => {
    const value = this.breakdown();

    if (!value || value.pointsToNextTier <= 0) {
      return [] as Array<{ title: string; level: string; note: string }>;
    }

    const currentIndex = this.tierOrder.indexOf(value.marketReadinessTier);
    const nextTier = this.tierOrder[Math.min(currentIndex + 1, this.tierOrder.length - 1)];

    return this.tierRoleExamples[nextTier] ?? [];
  });

  categoryLabel(category: string): string {
    return this.categoryLabels[category] ?? this.formatTierLabel(category.replace(/_/g, ' '));
  }

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
