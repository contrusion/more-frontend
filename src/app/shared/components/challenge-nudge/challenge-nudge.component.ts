import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CandidateChallengeView } from '../../../functional-features/recruitment/candidate/challenges/challenge.model';

@Component({
  selector: 'app-challenge-nudge',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './challenge-nudge.component.html',
  styleUrls: ['./challenge-nudge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeNudgeComponent {
  /**
   * Pass the list of available (not yet enrolled) challenges.
   * The component surfaces the highest-value one as a nudge.
   */
  @Input() set challenges(value: CandidateChallengeView[]) {
    this._challenges.set(value);
  }

  /** Points needed to reach the next tier (pass 0 if unknown) */
  @Input() set pointsToNextTier(value: number) {
    this._pointsToNextTier.set(value);
  }

  private readonly _challenges = signal<CandidateChallengeView[]>([]);
  private readonly _pointsToNextTier = signal(0);

  readonly topChallenge = computed<CandidateChallengeView | null>(() => {
    const available = this._challenges().filter(c => c.enrolmentStatus === null);
    if (available.length === 0) return null;
    return available.reduce((best, c) => c.rewardPoints > best.rewardPoints ? c : best, available[0]);
  });

  readonly nudgeMessage = computed(() => {
    const c = this.topChallenge();
    if (!c) return null;
    const pts = this._pointsToNextTier();
    if (pts > 0) {
      return `Complete "${c.title}" (+${c.rewardPoints} pts) — only ${pts} pts away from your next tier.`;
    }
    return `Try "${c.title}" to earn +${c.rewardPoints} pts and strengthen your profile.`;
  });
}
