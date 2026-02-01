import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();
  public isAuthenticated$!: Observable<{ isAuthenticated: boolean }>; // will be assigned in constructor

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private router: Router
  ) {
    console.log('AuthService constructor - initializing...');
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

    // Subscribe to user data changes
    this.oidcSecurityService.userData$.subscribe(userData => {
      console.log('userData$ changed:', userData);
      this.userDataSubject.next(userData?.userData);
    });

    // Check authentication status on startup
    console.log('Calling checkAuth() on startup...');
    this.checkAuth().subscribe(isAuth => {
      console.log('checkAuth() result on startup:', isAuth);
    });
  }

  public checkAuth(): Observable<boolean> {
    console.log('checkAuth() called');
    return this.oidcSecurityService.checkAuth().pipe(
      map(({ isAuthenticated, userData, accessToken, errorMessage }) => {
        console.log('checkAuth() response:', { 
          isAuthenticated, 
          hasUserData: !!userData, 
          hasAccessToken: !!accessToken, 
          errorMessage 
        });
        return isAuthenticated;
      })
    );
  }

  public login(): void {
    console.log('Login triggered - redirecting to Keycloak');
    console.log('Current localStorage keys:', Object.keys(localStorage));
    // Clear any existing auth state before redirecting
    localStorage.removeItem('authStateControl');
    localStorage.removeItem('authnResult');
    console.log('Cleared auth state from localStorage');
    console.log('Calling oidcSecurityService.authorize()...');
    this.oidcSecurityService.authorize();
    console.log('authorize() method called - redirect should happen immediately');
  }

  public logout(): void {
    this.oidcSecurityService.logoff().subscribe(success => {
      if (success) {
        this.router.navigate(['/']);
      }
    });
  }

  public getAccessToken(): Observable<string> {
    return this.oidcSecurityService.getAccessToken();
  }

  public getUserRoles(): string[] {
    const userData = this.userDataSubject.value;
    if (userData && userData.resource_access) {
      const clientRoles = userData.resource_access['mo-fe']?.roles || [];
      const realmRoles = userData.realm_access?.roles || [];
      return [...clientRoles, ...realmRoles];
    }
    return [];
  }

  public hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
}