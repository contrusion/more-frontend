import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MlUnknownClassification, MlUnknownStatus } from './ml-prompt.model';
import { MlPromptService } from './ml-prompt.service';
import { extractErrorMessages } from './ml-prompt-error.util';

type StatusFilter = MlUnknownStatus | 'ALL';

@Component({
  selector: 'app-ml-unknown-classifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, ButtonModule, TagModule],
  templateUrl: './ml-unknown-classifications.component.html',
  styleUrls: ['./ml-prompt-shared.css', './ml-unknown-classifications.component.css']
})
export class MlUnknownClassificationsComponent implements OnInit {
  private readonly service = inject(MlPromptService);

  readonly pageSize = 20;

  readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'New', value: 'NEW' },
    { label: 'Reviewed', value: 'REVIEWED' },
    { label: 'Dismissed', value: 'DISMISSED' }
  ];

  readonly items = signal<MlUnknownClassification[]>([]);
  readonly filter = signal<StatusFilter>('NEW');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly loading = signal(true);
  readonly errors = signal<string[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);

  readonly hasPrevious = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    const status = this.filter() === 'ALL' ? null : (this.filter() as MlUnknownStatus);
    this.service.getUnknownClassifications(status, this.page(), this.pageSize).subscribe({
      next: result => {
        this.items.set(result.content);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: err => {
        this.errors.set(extractErrorMessages(err, 'Failed to load unrecognised classifications. Please try again.'));
        this.loading.set(false);
      }
    });
  }

  applyFilter(value: StatusFilter): void {
    this.filter.set(value);
    this.page.set(0);
    this.expandedId.set(null);
    this.load();
  }

  previousPage(): void {
    if (this.hasPrevious()) {
      this.page.update(page => page - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update(page => page + 1);
      this.load();
    }
  }

  toggle(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  setStatus(item: MlUnknownClassification, status: MlUnknownStatus): void {
    this.updatingId.set(item.id);
    this.errors.set([]);
    this.service.updateUnknownStatus(item.id, status).subscribe({
      next: updated => {
        this.updatingId.set(null);
        if (this.filter() === 'ALL') {
          this.items.update(list => list.map(entry => (entry.id === updated.id ? updated : entry)));
        } else {
          this.items.update(list => list.filter(entry => entry.id !== updated.id));
          this.totalElements.update(total => Math.max(0, total - 1));
        }
        this.service.getUnknownSummary().subscribe({ error: () => undefined });
      },
      error: err => {
        this.updatingId.set(null);
        this.errors.set(extractErrorMessages(err, 'Could not update the status.'));
      }
    });
  }

  statusSeverity(status: MlUnknownStatus): 'warn' | 'success' | 'secondary' {
    switch (status) {
      case 'NEW': return 'warn';
      case 'REVIEWED': return 'success';
      case 'DISMISSED': return 'secondary';
    }
  }

  retentionLabel(item: MlUnknownClassification): string {
    if (item.daysRemaining <= 0) {
      return 'Deleted today';
    }
    return item.daysRemaining === 1 ? 'Deleted in 1 day' : `Deleted in ${item.daysRemaining} days`;
  }
}
