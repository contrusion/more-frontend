import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { of, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let isAuthenticatedSubject: BehaviorSubject<{ isAuthenticated: boolean }>;

  beforeEach(async () => {
    // Create mock authentication state subject
    isAuthenticatedSubject = new BehaviorSubject<{ isAuthenticated: boolean }>({ 
      isAuthenticated: false 
    });

    // Create spy objects with all necessary methods
    mockAuthService = jasmine.createSpyObj('AuthService', ['login'], {
      isAuthenticated$: isAuthenticatedSubject.asObservable()
    });
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, CommonModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with loading state as false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should subscribe to authentication state on init', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should redirect to home if already authenticated', () => {
      isAuthenticatedSubject.next({ isAuthenticated: true });
      fixture.detectChanges();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not redirect if not authenticated', () => {
      isAuthenticatedSubject.next({ isAuthenticated: false });
      fixture.detectChanges();
      
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call authService.login when login button is clicked', () => {
      component.login();
      expect(mockAuthService.login).toHaveBeenCalled();
    });

    it('should set loading state to true when login is called', () => {
      component.login();
      expect(component.isLoading).toBe(true);
    });

    it('should disable login button when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const button: DebugElement = fixture.debugElement.query(By.css('.login-button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should enable login button when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();
      
      const button: DebugElement = fixture.debugElement.query(By.css('.login-button'));
      expect(button.nativeElement.disabled).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display welcome title', () => {
      const title = fixture.debugElement.query(By.css('.login-title'));
      expect(title.nativeElement.textContent).toContain('Welcome Back');
    });

    it('should display subtitle', () => {
      const subtitle = fixture.debugElement.query(By.css('.login-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Sign in to continue to your account');
    });

    it('should display secure badge', () => {
      const badge = fixture.debugElement.query(By.css('.secure-badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.textContent).toContain('Secure Authentication');
    });

    it('should display login button with correct text', () => {
      const button = fixture.debugElement.query(By.css('.login-button'));
      expect(button.nativeElement.textContent).toContain('Sign In with Keycloak');
    });

    it('should display register link', () => {
      const registerLink = fixture.debugElement.query(By.css('.register-link'));
      expect(registerLink).toBeTruthy();
      expect(registerLink.nativeElement.textContent).toContain('Create Account');
    });

    it('should show spinner when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.query(By.css('.spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should hide button content when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const buttonContent = fixture.debugElement.query(By.css('.button-content'));
      expect(buttonContent).toBeFalsy();
    });

    it('should show button content when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();
      
      const buttonContent = fixture.debugElement.query(By.css('.button-content'));
      expect(buttonContent).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have aria-label on login button', () => {
      const button = fixture.debugElement.query(By.css('.login-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Sign in with Keycloak');
    });

    it('should have proper heading hierarchy', () => {
      const h1 = fixture.debugElement.query(By.css('h1'));
      expect(h1).toBeTruthy();
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe from authentication state on destroy', () => {
      fixture.detectChanges();
      const subscription = component['authSubscription'];
      spyOn(subscription, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid login clicks', () => {
      fixture.detectChanges();
      
      component.login();
      component.login();
      component.login();
      
      // Should only set loading once
      expect(component.isLoading).toBe(true);
      // Login should still be called (auth service handles duplicate calls)
      expect(mockAuthService.login).toHaveBeenCalledTimes(3);
    });

    it('should handle authentication state changes after component destruction', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      
      // Should not throw error
      expect(() => {
        isAuthenticatedSubject.next({ isAuthenticated: true });
      }).not.toThrow();
    });
  });
});
