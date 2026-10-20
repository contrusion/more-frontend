import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../none-functional-features/authentication-and-authorization/services/auth.service';
import { getInteractionsNavLinksForRole, NavLink } from '../../shared/navigation/interactions-nav';
import { NavDrawerService } from '../../shared/services/nav-drawer.service';

@Component({
  selector: 'app-interactions-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="interactions-layout">
      <nav class="interactions-nav" [class.nav-hidden]="navDrawerService.isOpen()">
        <button
          *ngFor="let item of navItems"
          class="nav-item"
          [class.active]="isActive(item.route.split('/').pop() || '')"
          (click)="navigate(item.route.split('/').pop() || '')"
        >
          <svg *ngIf="item.route.includes('analytics')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
          <svg *ngIf="item.route.includes('events')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <svg *ngIf="item.route.includes('recruiters') || item.route.includes('candidates')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="10" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <svg *ngIf="item.route.includes('reconnection')" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 17 2 2a1 1 0 1 0 3-3"></path>
            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path>
            <path d="m21 3 1 11h-2"></path>
            <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path>
            <path d="M3 4h8"></path>
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="interactions-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .interactions-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .interactions-nav {
      width: 80px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      border-right: 1px solid rgba(14, 165, 233, 0.2);
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

    .nav-hidden {
      display: none;
    }

    .interactions-content {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .interactions-nav {
        width: 70px;
      }
      
      .nav-item span {
        font-size: 0.65rem;
      }
    }
  `]
})
export class InteractionsLayoutComponent {
  navItems: NavLink[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public navDrawerService: NavDrawerService,
    private authService: AuthService
  ) {
    const role = authService.hasRole('APPLICANT') ? 'APPLICANT' : authService.hasRole('RECRUITER') ? 'RECRUITER' : null;
    this.navItems = [...getInteractionsNavLinksForRole(role)];
  }

  isActive(path: string): boolean {
    return this.router.url.includes(`/interactions/${path}`);
  }

  navigate(path: string): void {
    this.router.navigate([`/interactions/${path}`]);
  }
}
