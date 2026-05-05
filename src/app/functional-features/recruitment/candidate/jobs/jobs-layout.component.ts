import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-jobs-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="jobs-layout">
      <nav class="jobs-nav">
        <button
          class="nav-item"
          [class.active]="isActive('opportunities')"
          (click)="navigate('opportunities')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <span>Opportunities</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('applications')"
          (click)="navigate('applications')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>My Applications</span>
        </button>
      </nav>
      <div class="jobs-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .jobs-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .jobs-nav {
      width: 80px;
      min-width: 80px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      padding: 1rem 0;
      border-right: 1px solid rgba(14, 165, 233, 0.2);
      overflow: hidden;
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
      font-size: 0.6rem;
      font-weight: 600;
      text-align: center;
      width: 100%;
      word-break: break-word;
      overflow-wrap: break-word;
      line-height: 1.2;
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
      display: block;
      width: 100%;
    }

    .jobs-content {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
    }
  `]
})
export class JobsLayoutComponent {
  constructor(private readonly router: Router) {}

  isActive(path: string): boolean {
    return this.router.url.includes('/jobs/' + path);
  }

  navigate(path: string): void {
    this.router.navigate(['/jobs/' + path]);
  }
}
