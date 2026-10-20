import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NavDrawerService } from '../../shared/services/nav-drawer.service';
import { MlPromptService } from './ml-prompt/ml-prompt.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <nav class="admin-nav" [class.nav-hidden]="navDrawerService.isOpen()">
        <button
          class="nav-item"
          [class.active]="isActive('dashboard')"
          (click)="navigate('dashboard')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Overview</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('users')"
          (click)="navigate('users')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Users</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('companies')"
          (click)="navigate('companies')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18"/>
            <path d="M5 21V7l7-4 7 4v14"/>
            <path d="M9 9h.01"/>
            <path d="M15 9h.01"/>
            <path d="M9 13h.01"/>
            <path d="M15 13h.01"/>
          </svg>
          <span>Companies</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('outreach-ml')"
          (click)="navigate('outreach-ml')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>ML Data</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('ml-prompt')"
          (click)="navigate('ml-prompt')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>Prompt</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('ml-unknown')"
          (click)="navigate('ml-unknown')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Review</span>
          @if (unreviewedCount() > 0) {
            <span class="nav-badge" [attr.aria-label]="unreviewedCount() + ' messages to review'">{{ unreviewedCount() > 99 ? '99+' : unreviewedCount() }}</span>
          }
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('challenges')"
          (click)="navigate('challenges')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Challenges</span>
        </button>
      </nav>
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

    .nav-item {
      position: relative;
    }

    .nav-item .nav-badge {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      min-width: 1.25rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      background: #f59e0b;
      color: #1f2937;
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
  private readonly mlPromptService = inject(MlPromptService);
  private readonly navigationSubscription: Subscription;

  /** Messages the model could not label, shown as a badge on the Review item. */
  readonly unreviewedCount = this.mlPromptService.unreviewedCount;

  constructor(private router: Router, public navDrawerService: NavDrawerService) {
    this.refreshUnreviewedCount();
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.refreshUnreviewedCount());
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  private refreshUnreviewedCount(): void {
    this.mlPromptService.getUnknownSummary().subscribe({ error: () => undefined });
  }

  isActive(path: string): boolean {
    return this.router.url.includes(`/admin/${path}`);
  }

  navigate(path: string): void {
    this.router.navigate([`/admin/${path}`]);
  }
}
