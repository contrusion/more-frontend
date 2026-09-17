import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CandidateChallengeView } from '../challenge.model';

@Component({
  selector: 'app-challenge-streak-tracker',
  standalone: true,
  imports: [],
  templateUrl: './challenge-streak-tracker.component.html',
  styleUrls: ['./challenge-streak-tracker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeStreakTrackerComponent {
  @Input() set enrolments(value: CandidateChallengeView[]) {
    this._enrolments.set(value);
  }

  private readonly _enrolments = signal<CandidateChallengeView[]>([]);

  /** Extract streak challenges and their progress from progressSnapshot JSON */
  readonly streakChallenges = computed(() => {
    return this._enrolments()
      .filter(c => c.category === 'ACTIVITY' && c.enrolmentStatus === 'IN_PROGRESS')
      .map(c => {
        let current = 0;
        let target = 10;
        if (c.progressSnapshot) {
          try {
            const snap = JSON.parse(c.progressSnapshot);
            current = snap.currentStreak ?? 0;
            target = snap.target ?? snap.streakWeeks ?? 10;
          } catch { /* ignore malformed snapshot */ }
        }
        return { title: c.title, current, target, weeks: this.buildWeeks(current, target) };
      });
  });

  private buildWeeks(current: number, target: number): { filled: boolean; index: number }[] {
    return Array.from({ length: target }, (_, i) => ({ filled: i < current, index: i }));
  }
}
