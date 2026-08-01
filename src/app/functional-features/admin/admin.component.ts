import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavDrawerService } from '../../shared/services/nav-drawer.service';

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
          [class.active]="isActive('outreach-ml')"
          (click)="navigate('outreach-ml')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>ML Data</span>
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
export class AdminComponent {
  constructor(private router: Router, public navDrawerService: NavDrawerService) {}

  isActive(path: string): boolean {
    return this.router.url.includes(`/admin/${path}`);
  }

  navigate(path: string): void {
    this.router.navigate([`/admin/${path}`]);
  }
}
