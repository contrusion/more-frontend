import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NavDrawerService } from '../../shared/services/nav-drawer.service';

@Component({
  selector: 'app-recruitment-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="recruitment-layout">
      <nav class="recruitment-nav" [class.nav-hidden]="navDrawerService.isOpen()">
        <button
          class="nav-item"
          [class.active]="isActive('living-cv')"
          (click)="navigate('living-cv')"
          *ngIf="!showGrowthOnly"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="M15 9h2M15 13h2M9 17h8"></path>
          </svg>
          <span>Living CV</span>
        </button>

        <div class="nav-group">
          <button class="nav-group-label" type="button" (click)="openGrowth()">
            <span class="group-label-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 21h18"></path>
                <path d="M6 18V8"></path>
                <path d="M12 18V5"></path>
                <path d="M18 18v-9"></path>
              </svg>
              <span>Growth</span>
            </span>
            <svg
              class="group-chevron"
              [class.expanded]="isGrowthExpanded"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          <div class="nav-group-children" *ngIf="isGrowthExpanded || showGrowthOnly">
            <button
              class="nav-item nav-subitem"
              [class.active]="isActive('market-readiness')"
              (click)="navigate('market-readiness')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"></path>
                <path d="M7 14l4-4 3 3 5-6"></path>
              </svg>
              <span>Market Readiness</span>
            </button>
            <button
              class="nav-item nav-subitem"
              [class.active]="isActive('challenges')"
              (click)="navigate('challenges')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"></path>
                <path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
                <path d="M17.5 5.5A8.5 8.5 0 1 1 6.5 5.5"></path>
              </svg>
              <span>Challenges</span>
            </button>
            <button
              class="nav-item nav-subitem"
              [class.active]="isActive('assessments')"
              (click)="navigate('assessments')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="3" width="16" height="18" rx="2"></rect>
                <path d="M8 7h8"></path>
                <path d="M8 11h8"></path>
                <path d="M8 15h5"></path>
              </svg>
              <span>Assessments</span>
            </button>
            <button
              class="nav-item nav-subitem"
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
          </div>
        </div>

        <button
          class="nav-item"
          [class.active]="isActive('work-experience')"
          (click)="navigate('work-experience')"
          *ngIf="!showGrowthOnly"
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
          *ngIf="!showGrowthOnly"
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
          *ngIf="!showGrowthOnly"
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
          *ngIf="!showGrowthOnly"
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
          *ngIf="!showGrowthOnly"
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

    .nav-group {
      display: flex;
      flex-direction: column;
      margin: 0.5rem 0 0.25rem;
      padding-top: 0.25rem;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
      gap: 0.25rem;
    }

    .nav-group-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.8rem 0.75rem;
      margin: 0;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(148, 163, 184, 0.9);
      font-weight: 700;
      background: transparent;
      border: none;
      border-radius: 12px;
      text-align: left;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
    }

    .group-label-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      width: 100%;
      color: inherit;
    }

    .group-label-inner svg {
      display: block;
      width: 20px;
      height: 20px;
    }

    .nav-group-label:hover {
      color: rgba(255, 255, 255, 0.95);
      background: rgba(14, 165, 233, 0.08);
    }

    .group-chevron {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .group-chevron.expanded {
      transform: rotate(180deg);
    }

    .nav-group-children {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      padding-left: 0;
      margin-top: 0.1rem;
    }

    .nav-subitem {
      margin: 0.1rem 0;
      padding: 0.75rem 0.5rem 0.75rem 1rem;
      width: 100%;
      box-sizing: border-box;
      border-left: 1px solid rgba(148, 163, 184, 0.2);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      margin: 0.25rem 0;
      width: 100%;
      box-sizing: border-box;
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
  isGrowthExpanded = false;

  constructor(private router: Router, public navDrawerService: NavDrawerService) {
    this.syncGrowthState();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncGrowthState());
  }

  get showGrowthOnly(): boolean {
    return ['/career-development/market-readiness', '/career-development/challenges', '/career-development/assessments', '/career-development/goals']
      .some((path) => this.router.url === path || this.router.url.startsWith(`${path}/`));
  }

  private syncGrowthState(): void {
    this.isGrowthExpanded = this.showGrowthOnly;
  }

  openGrowth(): void {
    this.isGrowthExpanded = true;
    this.router.navigate(['/career-development/market-readiness']);
  }

  toggleGrowth(): void {
    if (this.showGrowthOnly) {
      this.isGrowthExpanded = true;
      return;
    }

    this.isGrowthExpanded = !this.isGrowthExpanded;
  }

  isGrowthPage(): boolean {
    return this.showGrowthOnly;
  }

  isActive(path: string): boolean {
    return this.router.url === `/career-development/${path}` || this.router.url.startsWith(`/career-development/${path}/`);
  }

  navigate(path: string): void {
    this.router.navigate([`/career-development/${path}`]);
    if (['market-readiness', 'challenges', 'assessments', 'goals'].includes(path)) {
      this.isGrowthExpanded = true;
    }
  }
}
