import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject, input } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { ActivityTone } from '../utils/activity-group.util';

export interface ActivityTimelineStep {
  label: string;
  /** Semantic colour intent of the activity group (how positive the status is for the candidate). */
  tone: ActivityTone;
  /** When the group first appeared in the thread. Undefined for future groups. */
  reachedAt?: Date;
  /** Number of events that landed in this group. */
  count: number;
  /** Past steps are ticked, the current one is highlighted, future steps are outlined. */
  state: 'past' | 'current' | 'upcoming';
  current: boolean;
}

/**
 * Presentational horizontal timeline of a thread's activity groups, oldest to newest.
 * The parent groups the events; this component only owns the layout.
 */
@Component({
  selector: 'app-stage-timeline',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage-timeline.component.html',
  styleUrls: ['./stage-timeline.component.css']
})
export class StageTimelineComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly steps = input.required<ActivityTimelineStep[]>();
  readonly ariaLabel = input('Recent activity');

  /**
   * Steps ready for display. A passed step that no message was classified into has no date of its own,
   * so it gets the window between the nearest dated step before it and after it (for example "3 - 9 Oct").
   */
  readonly displaySteps = computed(() => {
    const steps = this.steps();
    return steps.map((step, index) => ({
      ...step,
      inferredRange: step.state === 'past' && !step.reachedAt ? this.inferRange(steps, index) : null
    }));
  });

  private inferRange(steps: ActivityTimelineStep[], index: number): string | null {
    const from = [...steps.slice(0, index)].reverse().find(step => step.reachedAt)?.reachedAt;
    const to = steps.slice(index + 1).find(step => step.reachedAt)?.reachedAt;
    if (!from || !to) {
      return null;
    }

    const format = (date: Date, pattern: string) => formatDate(date, pattern, this.locale);
    if (format(from, 'yMd') === format(to, 'yMd')) {
      return format(to, 'd MMM');
    }

    const sameMonth = format(from, 'yM') === format(to, 'yM');
    return `${format(from, sameMonth ? 'd' : 'd MMM')} \u2013 ${format(to, 'd MMM')}`;
  }
}
