import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-interactions-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="interactions-layout">
      <nav class="interactions-nav">
        <button 
          class="nav-item"
          [class.active]="isActive('analytics')"
          (click)="navigate('analytics')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
          <span>Analytics</span>
        </button>
        <button 
          class="nav-item"
          [class.active]="isActive('messages')"
          (click)="navigate('messages')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Messages</span>
        </button>
        <button 
          class="nav-item"
          [class.active]="isActive('reconnection')"
          (click)="navigate('reconnection')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2L13.5 6.5L18 8L13.5 9.5L12 14L10.5 9.5L6 8L10.5 6.5L12 2Z"/>
            <path d="M19 11L19.75 13.25L22 14L19.75 14.75L19 17L18.25 14.75L16 14L18.25 13.25L19 11Z"/>
          </svg>
          <span>Reconnect</span>
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
  constructor(private router: Router, private route: ActivatedRoute) {}

  isActive(path: string): boolean {
    return this.router.url.includes(`/interactions/${path}`);
  }

  navigate(path: string): void {
    this.router.navigate([`/interactions/${path}`]);
  }
}
