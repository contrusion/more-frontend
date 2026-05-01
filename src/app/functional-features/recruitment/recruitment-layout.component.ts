import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-recruitment-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="recruitment-layout">
      <nav class="recruitment-nav">
        <button
          class="nav-item"
          [class.active]="isActive('living-cv')"
          (click)="navigate('living-cv')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="M15 9h2M15 13h2M9 17h8"></path>
          </svg>
          <span>Living CV</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('goals')"
          (click)="navigate('goals')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span>Goals</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('work-experience')"
          (click)="navigate('work-experience')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2"></rect>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>
          </svg>
          <span>Work</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('education')"
          (click)="navigate('education')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <span>Education</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('skills')"
          (click)="navigate('skills')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Skills</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('certifications')"
          (click)="navigate('certifications')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"></circle>
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
          </svg>
          <span>Certs</span>
        </button>
        <button
          class="nav-item"
          [class.active]="isActive('references')"
          (click)="navigate('references')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Refs</span>
        </button>
      </nav>
      <div class="recruitment-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .recruitment-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .recruitment-nav {
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

    .recruitment-content {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .recruitment-nav {
        width: 70px;
      }

      .nav-item span {
        font-size: 0.65rem;
      }
    }
  `]
})
export class RecruitmentLayoutComponent {
  constructor(private router: Router) {}

  isActive(path: string): boolean {
    return this.router.url.includes(`/personal-development/${path}`);
  }

  navigate(path: string): void {
    this.router.navigate([`/personal-development/${path}`]);
  }
}
