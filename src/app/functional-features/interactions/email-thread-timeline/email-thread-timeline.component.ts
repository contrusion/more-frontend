import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimelineModule } from 'primeng/timeline';
import { InteractionService } from '../services/interaction.service';
import { EmailThreadMessage } from '../models/interaction.model';

/**
 * Presentational timeline of a full email thread (recruiter messages and the candidate's replies).
 * The thread is read live from Gmail through the backend.
 */
@Component({
  selector: 'app-email-thread-timeline',
  standalone: true,
  imports: [DatePipe, TimelineModule],
  templateUrl: './email-thread-timeline.component.html',
  styleUrls: ['./email-thread-timeline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailThreadTimelineComponent implements OnInit {
  interactionId = input.required<string>();
  threadId = input.required<string>();

  messages = signal<EmailThreadMessage[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  private readonly interactionService = inject(InteractionService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.interactionService
      .getEmailThread(this.interactionId(), this.threadId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: messages => {
          this.messages.set(
            [...messages].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
          );
          this.loading.set(false);
        },
        error: () => {
          this.error.set('The full conversation could not be loaded from Gmail.');
          this.loading.set(false);
        }
      });
  }

  toLabel(value: string): string {
    if (value === 'PENDING_CLASSIFICATION' || value === 'UNKNOWN') {
      return 'Not Classified';
    }
    return value.replaceAll('_', ' ');
  }
}
