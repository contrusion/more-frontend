import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthService } from '../../none-functional-features/authentication-and-authorization/services/auth.service';
import { of } from 'rxjs';

describe('Home', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getUserRoles',
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

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
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
});
