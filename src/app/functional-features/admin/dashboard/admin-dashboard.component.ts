import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminOverviewService, AdminOverview } from './admin-overview.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly overviewService = inject(AdminOverviewService);
  private readonly destroy$ = new Subject<void>();

  overview = signal<AdminOverview | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.overviewService.getOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.overview.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load platform overview. Please try again.');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
