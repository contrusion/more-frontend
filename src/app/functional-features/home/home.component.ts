import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../none-functional-features/authentication-and-authorization/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface NavigationTile {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  roles?: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userName: string = '';
  userEmail: string = '';
  userBio: string = '';
  userJobTitle: string = '';
  userRoles: string[] = [];
  isSidebarOpen = false;

  navigationTiles: NavigationTile[] = [
    {
      title: 'Interactions',
      description: 'Track all recruitment communications across platforms - from first contact to hire',
      icon: 'clipboard',
      route: '/interactions',
      color: '#0ea5e9',
      roles: ['APPLICANT', 'RECRUITER']
    },
    {
      title: 'Interviews',
      description: 'View and update your professional profile',
      icon: 'calendar',
      route: '/interviews',
      color: '#8b5cf6'
    },
    {
      title: 'Job Opportunities and Applications',
      description: 'Manage job postings and track applications',
      icon: 'briefcase',
      route: '/jobs',
      color: '#10b981',
      roles: ['APPLICANT', 'RECRUITER']
    },
    {
      title: 'Talent Search',
      description: 'Find and connect with qualified candidates',
      icon: 'search',
      route: '/search',
      color: '#f59e0b',
      roles: ['RECRUITER']
    },
    {
      title: 'Connections',
      description: 'View and respond to your conversations',
      icon: 'users',
      route: '/connections',
      color: '#ec4899'
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: 'settings',
      route: '/settings',
      color: '#6366f1'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {
        if (userData) {
          this.userName = userData.name || userData.preferred_username || 'User';
          this.userEmail = userData.email || '';
          // Bio and jobTitle would need to come from your backend API
          // You may need to create a service to fetch user profile details
        }
      });

    this.userRoles = this.authService.getUserRoles();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isSidebarOpen = false;
  }

  canAccessTile(tile: NavigationTile): boolean {
    // Temporarily show all tiles for testing
    //return true;
    
    //Original role-based logic (uncomment when authentication is working):
     if (!tile.roles || tile.roles.length === 0) {
       return true;
     }
     return tile.roles.some(role => this.authService.hasRole(role));
  }

  logout(): void {
    this.authService.logout();
  }

  getVisibleTiles(): NavigationTile[] {
    return this.navigationTiles.filter(tile => this.canAccessTile(tile));
  }
}
