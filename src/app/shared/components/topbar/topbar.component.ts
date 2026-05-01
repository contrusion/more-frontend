import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../none-functional-features/authentication-and-authorization/services/auth.service';
import { DailyDigestService, DailyDigest } from '../../../functional-features/interactions/services/daily-digest.service';
import { Subject, takeUntil, filter } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userName: string = '';
  userEmail: string = '';
  userRoles: string[] = [];
  breadcrumbs: Breadcrumb[] = [];
  isProfileMenuOpen = false;
  isNotificationsOpen = false;
  notificationCount = 0;
  
  // Daily digest
  dailyDigest: DailyDigest | null = null;
  hasUrgentItems = false;
  isDigestOpen = false;
  showDigestToast = false;
  digestViewed = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dailyDigestService: DailyDigestService
  ) {}

  ngOnInit(): void {
    // Load user data
    this.authService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {
        if (userData) {
          this.userName = userData.name || userData.preferred_username || 'User';
          this.userEmail = userData.email || '';
        }
      });

    this.userRoles = this.authService.getUserRoles();

    // Update breadcrumbs on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
      });

    // Initial breadcrumbs
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
    
    // Check if digest was already viewed
    this.digestViewed = localStorage.getItem('digestViewed') === 'true';
    
    // Load daily digest
    this.dailyDigestService.getDailyDigest()
      .pipe(takeUntil(this.destroy$))
      .subscribe(digest => {
        this.dailyDigest = digest;
        // Check if there are any urgent items (priority, attention, alert)
        this.hasUrgentItems = digest.insights.some(insight => 
          insight.type === 'priority' || 
          insight.type === 'attention' || 
          insight.type === 'alert'
        );
        
        // Show toast if has urgent items and not viewed yet
        if (this.hasUrgentItems && !this.digestViewed) {
          setTimeout(() => {
            this.showDigestToast = true;
            // Auto-hide after 3 seconds
            setTimeout(() => {
              this.showDigestToast = false;
            }, 3000);
          }, 500);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = this.getRouteLabel(routeURL);
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private getRouteLabel(route: string): string {
    const routeLabels: { [key: string]: string } = {
      'home': 'Home',
      'interactions': 'Interactions',
      'personal-development': 'Personal Development',
      'goals': 'My Goals',
      'profile': 'Profile',
      'jobs': 'Job Opportunities',
      'search': 'Talent Search',
      'events': 'Events',
      'settings': 'Settings'
    };

    return routeLabels[route] || this.capitalizeFirstLetter(route);
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isNotificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isProfileMenuOpen = false;
      this.isDigestOpen = false;
    }
  }
  
  toggleDigest(): void {
    this.isDigestOpen = !this.isDigestOpen;
    if (this.isDigestOpen) {
      this.isProfileMenuOpen = false;
      this.isNotificationsOpen = false;
      
      // Mark as viewed and stop animation
      if (!this.digestViewed) {
        this.digestViewed = true;
        localStorage.setItem('digestViewed', 'true');
      }
    }
  }

  closeMenus(): void {
    this.isProfileMenuOpen = false;
    this.isNotificationsOpen = false;
    this.isDigestOpen = false;
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
    this.closeMenus();
  }

  goToProfile(): void {
    this.navigateTo('/profile');
  }

  goToSettings(): void {
    this.navigateTo('/settings');
  }

  goToAdmin(): void {
    this.navigateTo('/admin');
  }

  isAdmin(): boolean {
    return this.authService.hasRole('MO_ADMIN');
  }

  logout(): void {
    this.authService.logout();
    this.closeMenus();
  }

  getUserInitials(): string {
    if (this.userName) {
      const parts = this.userName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return this.userName.substring(0, 2).toUpperCase();
    }
    return 'U';
  }
  
  navigateToDigest(insight?: any): void {
    if (insight?.actionUrl) {
      this.router.navigate([insight.actionUrl]);
    } else {
      this.router.navigate(['/interactions/events']);
    }
    this.closeMenus();
  }
}
