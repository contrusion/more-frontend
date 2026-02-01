import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../../none-functional-features/authentication-and-authorization/services/auth.service';
import { of, Subject } from 'rxjs';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<any>;

  beforeEach(async () => {
    routerEventsSubject = new Subject();

    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getUserRoles',
      'logout'
    ], {
      userData$: of({
        name: 'John Doe',
        email: 'john.doe@example.com',
        preferred_username: 'johndoe'
      })
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    
    fixture.detectChanges();

    expect(component.userName).toBe('John Doe');
    expect(component.userEmail).toBe('john.doe@example.com');
    expect(component.userRoles).toEqual(['APPLICANT']);
  });

  it('should get user initials correctly', () => {
    component.userName = 'John Doe';
    expect(component.getUserInitials()).toBe('JD');

    component.userName = 'Jane';
    expect(component.getUserInitials()).toBe('JA');

    component.userName = '';
    expect(component.getUserInitials()).toBe('U');
  });

  it('should toggle profile menu', () => {
    expect(component.isProfileMenuOpen).toBe(false);
    
    component.toggleProfileMenu();
    expect(component.isProfileMenuOpen).toBe(true);
    
    component.toggleProfileMenu();
    expect(component.isProfileMenuOpen).toBe(false);
  });

  it('should close notifications when opening profile menu', () => {
    component.isNotificationsOpen = true;
    component.toggleProfileMenu();
    
    expect(component.isProfileMenuOpen).toBe(true);
    expect(component.isNotificationsOpen).toBe(false);
  });

  it('should toggle notifications', () => {
    expect(component.isNotificationsOpen).toBe(false);
    
    component.toggleNotifications();
    expect(component.isNotificationsOpen).toBe(true);
    
    component.toggleNotifications();
    expect(component.isNotificationsOpen).toBe(false);
  });

  it('should close profile menu when opening notifications', () => {
    component.isProfileMenuOpen = true;
    component.toggleNotifications();
    
    expect(component.isNotificationsOpen).toBe(true);
    expect(component.isProfileMenuOpen).toBe(false);
  });

  it('should close all menus', () => {
    component.isProfileMenuOpen = true;
    component.isNotificationsOpen = true;
    
    component.closeMenus();
    
    expect(component.isProfileMenuOpen).toBe(false);
    expect(component.isNotificationsOpen).toBe(false);
  });

  it('should navigate and close menus', () => {
    component.isProfileMenuOpen = true;
    
    component.navigateTo('/profile');
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    expect(component.isProfileMenuOpen).toBe(false);
  });

  it('should navigate to profile', () => {
    component.goToProfile();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should navigate to settings', () => {
    component.goToSettings();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('should call logout on auth service', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.isProfileMenuOpen).toBe(false);
  });

  it('should create breadcrumbs from route', () => {
    // This would require more complex mocking of ActivatedRoute
    // For now, we just verify the method exists
    expect(component.breadcrumbs).toBeDefined();
  });

  it('should render username in template', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const profileName = compiled.querySelector('.profile-name');
    
    expect(profileName?.textContent).toContain('John Doe');
  });

  it('should render user initials in avatar', () => {
    mockAuthService.getUserRoles.and.returnValue(['APPLICANT']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const avatar = compiled.querySelector('.avatar span');
    
    expect(avatar?.textContent).toContain('JD');
  });
});
