import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Challenge, ChallengeImportResult, ChallengeStatus } from '../challenge.model';
import { ChallengeService } from '../challenge.service';

type StatusFilter = ChallengeStatus | 'ALL';

@Component({
  selector: 'app-challenge-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TableModule, TagModule, ButtonModule, TooltipModule],
  templateUrl: './challenge-library.component.html',
  styleUrls: ['./challenge-library.component.css']
})
export class ChallengeLibraryComponent implements OnInit {

  @ViewChild('csvInput') csvInput!: ElementRef<HTMLInputElement>;

  readonly challenges = signal<Challenge[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly importing = signal(false);
  readonly importResult = signal<ChallengeImportResult | null>(null);

  readonly filteredChallenges = computed(() => {
    const filter = this.statusFilter();
    const all = this.challenges();
    return filter === 'ALL' ? all : all.filter(c => c.status === filter);
  });

  readonly statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Retired', value: 'RETIRED' }
  ];

  constructor(
    private challengeService: ChallengeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.challengeService.getAllChallenges().subscribe({
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

  applyFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/challenges/new']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/admin/challenges', id, 'edit']);
  }

  retire(challenge: Challenge): void {
    this.challengeService.updateChallengeStatus(challenge.id, { status: 'RETIRED' }).subscribe({
      next: updated => {
        this.challenges.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
      },
      error: () => this.error.set('Failed to retire challenge.')
    });
  }

  clone(challenge: Challenge): void {
    this.challengeService.cloneChallenge(challenge.id).subscribe({
      next: cloned => {
        this.challenges.update(list => [cloned, ...list]);
      },
      error: () => this.error.set('Failed to clone challenge.')
    });
  }

  activate(challenge: Challenge): void {
    this.challengeService.updateChallengeStatus(challenge.id, { status: 'ACTIVE' }).subscribe({
      next: updated => {
        this.challenges.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
      },
      error: () => this.error.set('Failed to activate challenge.')
    });
  }

  getStatusSeverity(status: ChallengeStatus): 'success' | 'info' | 'secondary' {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'info';
      case 'RETIRED': return 'secondary';
    }
  }

  triggerCsvUpload(): void {
    this.csvInput.nativeElement.value = '';
    this.csvInput.nativeElement.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importResult.set(null);
    this.error.set(null);

    this.challengeService.importFromCsv(file).subscribe({
      next: result => {
        this.importResult.set(result);
        this.importing.set(false);
        // Reload list to include newly imported challenges
        this.load();
      },
      error: () => {
        this.error.set('Failed to import CSV. Ensure the file format is correct.');
        this.importing.set(false);
      }
    });
  }

  dismissImportResult(): void {
    this.importResult.set(null);
  }
}
