import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthService } from '../../none-functional-features/authentication-and-authorization/services/auth.service';
import { MarketReadinessService } from '../recruitment/candidate/services/market-readiness.service';
import { InteractionService } from '../interactions/services/interaction.service';
import { InteractionStatus, InteractionThread } from '../interactions/models/interaction.model';
import { of } from 'rxjs';

describe('Home', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMarketReadinessService: jasmine.SpyObj<MarketReadinessService>;
  let mockInteractionService: jasmine.SpyObj<InteractionService>;

  const thread = (id: string, status: InteractionStatus, participantId = id): InteractionThread => ({
    id,
    participantId,
    participantName: 'Recruiter',
    participantRole: 'RECRUITER',
    status,
    opportunities: [],
    lastEventDate: new Date(),
    lastEventPreview: '',
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    events: []
  });
  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getUserRoles',
      'getUserPersona',
      'hasRole',
      'logout'
    ], {
      userData$: of({
        name: 'Test User',
        email: 'test@example.com',
        preferred_username: 'testuser'
      })
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService.getUserPersona.and.returnValue('WARM_LEAD');
    mockMarketReadinessService = jasmine.createSpyObj('MarketReadinessService', ['getMyMarketReadiness']);
    mockInteractionService = jasmine.createSpyObj('InteractionService', ['getThreads']);
    mockInteractionService.getThreads.and.returnValue(of([
      thread('1', InteractionStatus.NEW, 'recruiter-a'),
      thread('2', InteractionStatus.ACTIVE, 'recruiter-b'),
      thread('3', InteractionStatus.CLOSED, 'recruiter-a')
    ]));
    mockMarketReadinessService.getMyMarketReadiness.and.returnValue(of({
      totalScore: 85,
      marketReadinessTier: 'GOLD',
      isAllStar: false,
      nextTierThreshold: 100,
      pointsToNextTier: 15,
      progressPercentToNextTier: 85,
      categories: [],
      nextSteps: [],
      pointsHistory: []
    }));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MarketReadinessService, useValue: mockMarketReadinessService },
        { provide: InteractionService, useValue: mockInteractionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    
    fixture.detectChanges();

    expect(component.userName).toBe('Test User');
    expect(component.userEmail).toBe('test@example.com');
  });

  it('should toggle sidebar', () => {
    expect(component.isSidebarOpen).toBe(false);
    
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(true);
    
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(false);
  });

  it('should show interaction totals computed from the user\'s threads', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    mockAuthService.hasRole.and.callFake((role: string) => role === 'APPLICANT');

    fixture.detectChanges();

    expect(component.interactionSummary).toEqual({
      activeInteractions: 2,
      upcomingInterviews: 0,
      newOpportunities: 2,
      recruiters: 2
    });

    const values = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.info-card-value'))
      .map(element => element.textContent?.trim());
    expect(values).toContain('2');
    expect(values).not.toContain('12');
    expect(values).not.toContain('24');
  });

  it('should not load or show interaction totals for users without interactions', () => {
    mockAuthService.getUserRoles.and.returnValue(['MO_ADMIN']);
    mockAuthService.hasRole.and.callFake((role: string) => role === 'MO_ADMIN');

    fixture.detectChanges();

    expect(mockInteractionService.getThreads).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Active Leads');
  });

  it('should list the Interactions sub-pages under the Leads area in the sidebar', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    mockAuthService.hasRole.and.callFake((role: string) => role === 'APPLICANT');

    fixture.detectChanges();

    const childLinks = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.sidebar-nav .nav-item--child'))
      .map(element => element.textContent?.trim());
    expect(childLinks).toEqual(['Analytics', 'Leads', 'My Recruiters', 'Reconnect']);
  });

  it('should navigate to route and close sidebar', () => {
    component.isSidebarOpen = true;
    
    component.navigateTo('/interactions');
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/interactions']);
    expect(component.isSidebarOpen).toBe(false);
  });

  it('should call logout on auth service', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should filter tiles based on user roles', () => {
    mockAuthService.hasRole.and.callFake((role: string) => role === 'APPLICANT');
    
    const visibleTiles = component.getVisibleTiles();
    
    expect(visibleTiles.length).toBeGreaterThan(0);
    expect(visibleTiles.every(tile => component.canAccessTile(tile))).toBe(true);
  });

  it('should show tiles without role restrictions to all users', () => {
    mockAuthService.hasRole.and.returnValue(false);
    
    const tilesWithoutRoles = component.navigationTiles.filter(tile => !tile.roles || tile.roles.length === 0);
    
    tilesWithoutRoles.forEach(tile => {
      expect(component.canAccessTile(tile)).toBe(true);
    });
  });

  it('should render welcome section with user name', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const welcomeTitle = compiled.querySelector('.welcome-title');
    
    expect(welcomeTitle?.textContent).toContain('Test User');
  });

  it('should render navigation tiles', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT', 'RECRUITER']);
    mockAuthService.hasRole.and.returnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.tile');
    
    expect(tiles.length).toBeGreaterThan(0);
  });

  it('should show market readiness summary with points to the next tier for applicants', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    mockAuthService.hasRole.and.callFake((role: string) => role === 'APPLICANT');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const marketReadinessCard = compiled.querySelector('.market-readiness-card');

    expect(marketReadinessCard).not.toBeNull();
    expect(marketReadinessCard?.textContent).toContain('Points to Platinum');
    expect(marketReadinessCard?.textContent).toContain('15');
    expect(marketReadinessCard?.textContent).toContain('Current tier: GOLD');
  });

  it('should show the selected talent persona in the user metadata', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    mockAuthService.hasRole.and.callFake((role: string) => role === 'APPLICANT');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaText = compiled.querySelector('.user-meta')?.textContent ?? '';

    expect(metaText).toContain('Warm Lead');
  });
});
