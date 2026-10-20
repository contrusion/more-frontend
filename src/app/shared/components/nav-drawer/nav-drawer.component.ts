import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { NavDrawerService } from '../../services/nav-drawer.service';
import { AuthService } from '../../../none-functional-features/authentication-and-authorization/services/auth.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { getInteractionsNavLinksForRole } from '../../navigation/interactions-nav';

interface NavChild {
  label: string;
  route: string;
  subchildren?: NavChild[];
}

interface NavSection {
  id: string;
  label: string;
  requiredRoles: string[];
  routePrefix: string;
  /** When set, the section renders as a single direct link instead of a collapsible group. */
  directRoute?: string;
  children: NavChild[];
}

const getInteractionsSectionChildren = (authService: AuthService): NavChild[] => {
  const role = authService.hasRole('APPLICANT') ? 'APPLICANT' : authService.hasRole('RECRUITER') ? 'RECRUITER' : null;
  return getInteractionsNavLinksForRole(role).map(link => ({ ...link }));
};

const getAllSections = (authService: AuthService): NavSection[] => [
  {
    id: 'interactions',
    label: 'Interactions',
    requiredRoles: ['APPLICANT', 'RECRUITER'],
    routePrefix: '/interactions',
    children: getInteractionsSectionChildren(authService)
  },
  {
    id: 'jobs',
    label: 'Jobs',
    requiredRoles: ['APPLICANT'],
    routePrefix: '/jobs',
    children: [
      { label: 'Opportunities', route: '/jobs/opportunities' },
      { label: 'My Applications', route: '/jobs/applications' }
    ]
  },
  {
    id: 'career-development',
    label: 'Career Development',
    requiredRoles: ['APPLICANT'],
    routePrefix: '/career-development',
    children: [
      { label: 'Living CV', route: '/career-development/living-cv' },
      {
        label: 'Growth',
        route: '/career-development/market-readiness',
        subchildren: [
          { label: 'Market Readiness', route: '/career-development/market-readiness' },
          { label: 'Challenges', route: '/career-development/challenges' },
          { label: 'Assessments', route: '/career-development/assessments' },
          { label: 'Goals', route: '/career-development/goals' }
        ]
      },
      { label: 'Work Experience', route: '/career-development/work-experience' },
      { label: 'Education', route: '/career-development/education' },
      { label: 'Certifications', route: '/career-development/certifications' },
      { label: 'Skills', route: '/career-development/skills' },
      { label: 'References', route: '/career-development/references' }
    ]
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    requiredRoles: ['RECRUITER'],
    routePrefix: '/recruiter',
    children: [
      { label: 'Job Ads', route: '/recruiter/job-ads' },
      { label: 'Candidate Pool', route: '/recruiter/candidates' },
      { label: 'Talent Search', route: '/search' }
    ]
  },
  {
    id: 'admin-home',
    label: 'Overview',
    requiredRoles: ['MO_ADMIN'],
    routePrefix: '/admin/dashboard',
    directRoute: '/admin/dashboard',
    children: []
  },
  {
    id: 'admin-users',
    label: 'User Management',
    requiredRoles: ['MO_ADMIN'],
    routePrefix: '/admin/users',
    directRoute: '/admin/users',
    children: []
  },
  {
    id: 'platform-ops',
    label: 'Platform Operations',
    requiredRoles: ['MO_ADMIN'],
    routePrefix: '/admin',
    children: [
      { label: 'Outreach ML Export', route: '/admin/outreach-ml' },
      { label: 'ML Prompt', route: '/admin/ml-prompt' },
      { label: 'ML Review', route: '/admin/ml-unknown' },
      { label: 'Interaction Events', route: '/interactions/events' }
    ]
  }
];

@Component({
  selector: 'app-nav-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-drawer.component.html',
  styleUrls: ['./nav-drawer.component.css']
})
export class NavDrawerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  visibleSections: NavSection[] = [];
  expandedSections = new Set<string>();
  expandedChildGroups = new Set<string>();
  currentUrl = '';

  constructor(
    public drawerService: NavDrawerService,
    private authService: AuthService,
    private router: Router,
    private featureFlagsService: FeatureFlagsService
  ) {}

  ngOnInit(): void {
    // Recompute visible sections whenever user data changes (handles async token loading)
    this.authService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.visibleSections = getAllSections(this.authService)
          .filter(section =>
            section.requiredRoles.length === 0 ||
            section.requiredRoles.some(role => this.authService.hasRole(role))
          )
          .map(section => ({
            ...section,
            label: section.id === 'interactions' ? this.getInteractionsSectionLabel() : section.label,
            children: section.children.filter(child => this.isFeatureRouteEnabled(child.route))
          }))
          .filter(section => section.directRoute || section.children.length > 0);
        this.expandActiveSection();
      });

    // Expand the active section by default
    this.currentUrl = this.router.url;
    this.expandActiveSection();

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
        this.expandActiveSection();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Final structure: candidate view = "Recruiter Leads" -> "Leads" + "My Recruiters";
  // recruiter view = "Candidate Leads" -> "Leads" + "My Candidates";
  // "Reconnect" remains a sibling workflow at /interactions/reconnection, not a child of the lead queue.
  // Route URLs stay stable while the visible labels intentionally differ to match product language.
  private getInteractionsSectionLabel(): string {
    if (this.authService.hasRole('APPLICANT')) {
      return 'Recruiter Leads';
    }
    if (this.authService.hasRole('RECRUITER')) {
      return 'Candidate Leads';
    }
    return 'Leads';
  }

  private expandActiveSection(): void {
    for (const section of this.visibleSections) {
      if (this.currentUrl.startsWith(section.routePrefix)) {
        this.expandedSections.add(section.id);
        return;
      }
    }
  }

  isSectionActive(section: NavSection): boolean {
    return this.currentUrl.startsWith(section.routePrefix);
  }

  getVisibleChildren(section: NavSection): NavChild[] {
    return section.children;
  }

  isChildActive(child: NavChild): boolean {
    return this.currentUrl === child.route || this.currentUrl.startsWith(child.route + '/');
  }

  isChildGroupActive(child: NavChild): boolean {
    if (this.isChildActive(child)) {
      return true;
    }

    return child.subchildren?.some((subchild) => this.isChildActive(subchild)) ?? false;
  }

  isChildGroupExpanded(section: NavSection, child: NavChild): boolean {
    const key = `${section.id}:${child.route}`;
    return this.expandedChildGroups.has(key) || this.currentUrl.startsWith(child.route);
  }

  isSectionExpanded(section: NavSection): boolean {
    return this.expandedSections.has(section.id);
  }

  toggleSection(section: NavSection): void {
    if (section.directRoute) {
      this.navigateTo(section.directRoute);
      return;
    }
    if (this.expandedSections.has(section.id)) {
      this.expandedSections.delete(section.id);
    } else {
      this.expandedSections.add(section.id);
    }
  }

  toggleChildGroup(section: NavSection, child: NavChild): void {
    if (!child.subchildren || child.subchildren.length === 0) {
      this.navigateTo(child.route);
      return;
    }

    const key = `${section.id}:${child.route}`;
    if (this.expandedChildGroups.has(key)) {
      this.expandedChildGroups.delete(key);
    } else {
      this.expandedChildGroups.add(key);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.drawerService.close();
  }

  navigateHome(): void {
    this.navigateTo('/home');
  }

  logout(): void {
    this.authService.logout();
    this.drawerService.close();
  }

  private isFeatureRouteEnabled(route: string): boolean {
    // Mirrors InteractionsAccessGuard: the flag only blocks admins, applicants and recruiters always have Interactions.
    if (route.startsWith('/interactions') && this.authService.hasRole('MO_ADMIN')) {
      return this.featureFlagsService.isInteractionsEventsEnabled();
    }

    return true;
  }
}
