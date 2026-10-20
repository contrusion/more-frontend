import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NavDrawerService } from '../../shared/services/nav-drawer.service';
import { getAdminRailLinks, ML_UNKNOWN_REVIEW_ROUTE } from '../../shared/navigation/admin-nav';
import { MlPromptService } from './ml-prompt/ml-prompt.service';
import { FeatureFlagsService } from '../../shared/services/feature-flags.service';

/**
 * Admin layout. The side rail shows only the pages of the drawer branch the admin is in
 * (same behaviour as the interactions, jobs and recruiter layouts). Single-page branches such as
 * Overview and User Management have no rail.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    <div class="admin-layout">
      @if (railLinks().length > 0) {
        <nav class="admin-nav" [class.nav-hidden]="navDrawerService.isOpen()">
          @for (link of railLinks(); track link.route) {
            <button
              class="nav-item"
              [class.active]="isActive(link.route)"
              (click)="navigate(link.route)"
            >
              @switch (link.icon) {
                @case ('companies') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l7-4 7 4v14"/>
                    <path d="M9 9h.01"/>
                    <path d="M15 9h.01"/>
                    <path d="M9 13h.01"/>
                    <path d="M15 13h.01"/>
                  </svg>
                }
                @case ('challenges') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                }
                @case ('ml-data') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                }
                @case ('ml-prompt') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                }
                @case ('ml-review') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('events') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                }
              }
              <span>{{ link.railLabel }}</span>
              @if (link.route === reviewRoute && unreviewedCount() > 0) {
                <span class="nav-badge" [attr.aria-label]="unreviewedCount() + ' messages to review'">{{ unreviewedCount() > 99 ? '99+' : unreviewedCount() }}</span>
              }
            </button>
          }
        </nav>
      }
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .admin-nav {
      width: 80px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      border-right: 1px solid rgba(14, 165, 233, 0.2);
      flex-shrink: 0;
    }

    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      margin: 0.25rem 0.5rem;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .nav-item:hover {
      background: rgba(14, 165, 233, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    .nav-item.active {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
    }

    .nav-item span {
      text-align: center;
    }

    .nav-item .nav-badge {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      min-width: 1.25rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      background: var(--color-warning-bg);
      color: var(--color-warning-text);
      font-size: 0.65rem;
      line-height: 1.25rem;
    }

    .nav-hidden {
      display: none;
    }

    .admin-content {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .admin-nav {
        width: 70px;
      }

      .nav-item span {
        font-size: 0.65rem;
      }
    }
  `]
})
export class AdminComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly mlPromptService = inject(MlPromptService);
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly navigationSubscription: Subscription;

  readonly navDrawerService = inject(NavDrawerService);
  readonly reviewRoute = ML_UNKNOWN_REVIEW_ROUTE;

  /** Messages the model could not label, shown as a badge on the Review item. */
  readonly unreviewedCount = this.mlPromptService.unreviewedCount;

  private readonly currentUrl = signal(this.router.url);
  readonly railLinks = computed(() =>
    getAdminRailLinks(this.currentUrl(), this.featureFlags.isInteractionsEventsEnabled())
  );

  constructor() {
    this.refreshUnreviewedCount();
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.refreshUnreviewedCount();
      });
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  private refreshUnreviewedCount(): void {
    this.mlPromptService.getUnknownSummary().subscribe({ error: () => undefined });
  }

  isActive(route: string): boolean {
    return this.currentUrl().startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
