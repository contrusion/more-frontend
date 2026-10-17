import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  readonly steps = input.required<ActivityTimelineStep[]>();
  readonly ariaLabel = input('Recent activity');
}
