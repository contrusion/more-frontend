import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../none-functional-features/authentication-and-authorization/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { MarketReadinessBreakdown } from '../recruitment/candidate/models/goal.model';
import { MarketReadinessService } from '../recruitment/candidate/services/market-readiness.service';
import { InteractionService } from '../interactions/services/interaction.service';
import { InteractionSummary, summariseInteractions } from '../interactions/utils/interaction-summary.util';
import { getInteractionsNavLinksForRole, NavLink } from '../../shared/navigation/interactions-nav';

interface NavigationTile {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  roles?: string[];
  /** Sub-pages listed under the tile in the sidebar. */
  children?: readonly NavLink[];
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
  userPersona: string | null = null;
  isSidebarOpen = false;
  marketReadiness: MarketReadinessBreakdown | null = null;
  interactionSummary: InteractionSummary | null = null;
  private interactionsSubscribed = false;
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
      title: 'Overview',
      description: 'Platform-wide health metrics and KPI dashboard',
      icon: 'grid',
      route: '/admin/dashboard',
      color: '#0ea5e9',
      roles: ['MO_ADMIN']
    },
    {
      title: 'User Management',
      description: 'Browse, search and manage all platform users',
      icon: 'users',
      route: '/admin/users',
      color: '#0ea5e9',
      roles: ['MO_ADMIN']
    },
    {
      title: 'ML Prompt',
      description: 'Edit the event labels and prompt the classifier uses, then publish a new version',
      icon: 'sparkles',
      route: '/admin/ml-prompt',
      color: '#0ea5e9',
      roles: ['MO_ADMIN']
    },
    {
      title: 'ML Review',
      description: 'Review messages the classifier could not label to improve the model',
      icon: 'clipboard',
      route: '/admin/ml-unknown-review',
      color: '#0ea5e9',
      roles: ['MO_ADMIN']
    },
    {
      title: 'Job Opportunities and Applications',
      description: 'Manage job postings and track applications',
      icon: 'briefcase',
      route: '/jobs',
      color: '#0ea5e9',
      roles: ['APPLICANT']
    },
    {
      title: 'Job Ads',
      description: 'Post and manage job advertisements to attract matched candidates from the pool.',
      icon: 'briefcase',
      route: '/recruiter/job-ads',
      color: '#0ea5e9',
      roles: ['RECRUITER']
    },
    {
      title: 'Talent Search',
      description: 'Search the full registry for candidates beyond the role-specific shortlist, including unclassified applicants.',
      icon: 'search',
      route: '/search',
      color: '#0ea5e9',
      roles: ['RECRUITER']
    },
    {
      title: 'Candidate Pool',
      description: 'Review the role-specific shortlist of best-matching candidates built from the current job fit data.',
      icon: 'users',
      route: '/recruiter/candidates',
      color: '#0ea5e9',
      roles: ['RECRUITER']
    },
    {
      title: 'Career Development',
      description: 'Track goals, log milestones, and showcase proof—every step strengthens your Living CV, builds trust, and earns your class badge as you evolve.',
      icon: 'sparkles',
      route: '/career-development',
      color: '#0ea5e9',
      roles: ['APPLICANT']
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: 'settings',
      route: '/settings',
      color: '#0ea5e9'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private marketReadinessService: MarketReadinessService,
    private interactionService: InteractionService
  ) {}

  ngOnInit(): void {
    // Resolved here (not in the field initializer, which runs before constructor parameter properties are assigned).
    this.navigationTiles[0].children = getInteractionsNavLinksForRole(this.isApplicant() ? 'APPLICANT' : 'RECRUITER');

    this.authService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {
        if (userData) {
          this.userName = userData.name || userData.preferred_username || 'User';
          this.userEmail = userData.email || '';
          // Bio and jobTitle would need to come from your backend API
          // You may need to create a service to fetch user profile details
        }

        this.userRoles = this.authService.getUserRoles();
        this.userPersona = this.authService.getUserPersona();
        this.loadMarketReadinessSummary();
        this.loadInteractionSummary();
      });

    this.userRoles = this.authService.getUserRoles();
    this.userPersona = this.authService.getUserPersona();
    this.loadMarketReadinessSummary();
    this.loadInteractionSummary();
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
    // Show tiles without role restrictions to everyone
    if (!tile.roles || tile.roles.length === 0) {
      return true;
    }
    // Check if user has any of the required roles
    return tile.roles.some(role => this.authService.hasRole(role));
  }

  private loadMarketReadinessSummary(): void {
    if (!this.isApplicant()) {
      this.marketReadiness = null;
      return;
    }

    this.marketReadinessService.getMyMarketReadiness()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (readiness) => this.marketReadiness = readiness,
        error: () => this.marketReadiness = null
      });
  }

  isApplicant(): boolean {
    return this.userRoles.includes('APPLICANT') || this.authService.hasRole('APPLICANT');
  }

  /** Interaction totals only make sense for users who have interactions (applicants and recruiters). */
  showInteractionSummary(): boolean {
    return this.isApplicant() || this.authService.hasRole('RECRUITER');
  }

  private loadInteractionSummary(): void {
    if (this.interactionsSubscribed || !this.showInteractionSummary()) {
      return;
    }

    this.interactionsSubscribed = true;
    this.interactionService.getThreads()
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => this.interactionSummary = summariseInteractions(threads));
  }

  getInteractionsTileTitle(): string {
    return this.isApplicant() ? 'Recruiter Leads' : 'Candidate Leads';
  }

  getActiveLeadsLabel(): string {
    return 'Active Leads';
  }

  getNewLeadsLabel(): string {
    return 'New Leads';
  }

  getNextTierLabel(): string {
    if (!this.marketReadiness) {
      return 'next tier';
    }

    switch (this.marketReadiness.marketReadinessTier) {
      case 'BRONZE':
        return 'Silver';
      case 'SILVER':
        return 'Gold';
      case 'GOLD':
        return 'Platinum';
      default:
        return 'next tier';
    }
  }

  getMarketReadinessLabel(): string {
    if (!this.marketReadiness) {
      return 'Market readiness';
    }

    return this.marketReadiness.pointsToNextTier > 0
      ? `Points to ${this.getNextTierLabel()}`
      : 'Top tier';
  }

  getMarketReadinessValue(): string {
    if (!this.marketReadiness) {
      return '—';
    }

    return this.marketReadiness.pointsToNextTier > 0
      ? this.marketReadiness.pointsToNextTier.toString()
      : 'Top tier';
  }

  getMarketReadinessSubtext(): string {
    if (!this.marketReadiness) {
      return 'Loading...';
    }

    return this.marketReadiness.pointsToNextTier > 0
      ? `Current tier: ${this.marketReadiness.marketReadinessTier}`
      : 'You have reached the highest tier';
  }

  getMarketReadinessPointsText(): string {
    if (!this.marketReadiness) {
      return '—';
    }

    if (this.marketReadiness.pointsToNextTier > 0) {
      return `${this.marketReadiness.pointsToNextTier} pts to next tier`;
    }

    return 'Top tier reached';
  }

  logout(): void {
    this.authService.logout();
  }

  getVisibleTiles(): NavigationTile[] {
    return this.navigationTiles.filter(tile => this.canAccessTile(tile));
  }

  getUserPersonaLabel(): string {
    if (!this.userPersona) {
      return 'Talent Persona';
    }

    switch (this.userPersona) {
      case 'PASSIVE_PROSPECT':
        return 'Passive Prospect';
      case 'WARM_LEAD':
        return 'Warm Lead';
      case 'ACTIVE_JOB_SEEKER':
        return 'Active Job Seeker';
      default:
        return 'Talent Persona';
    }
  }
}
