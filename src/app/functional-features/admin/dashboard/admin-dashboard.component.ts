import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminOverviewService, AdminOverview } from './admin-overview.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private readonly overviewService = inject(AdminOverviewService);
  private readonly destroyRef = inject(DestroyRef);

  overview = signal<AdminOverview | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  refreshing = signal(false);

  ngOnInit(): void {
    this.loadOverview();
  }

  refreshOverview(): void {
    this.refreshing.set(true);
    this.loadOverview();
  }

  private loadOverview(): void {
    this.loading.set(this.overview() === null);
    this.error.set(null);

    this.overviewService.getOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.overview.set(data);
          this.loading.set(false);
          this.refreshing.set(false);
        },
        error: () => {
          this.error.set('Failed to load platform overview. Please try again.');
          this.loading.set(false);
          this.refreshing.set(false);
        }
      });
  }
}
