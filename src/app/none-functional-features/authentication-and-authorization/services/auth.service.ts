import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface AccountProfile {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  bio: string | null;
  location: string | null;
  phoneNumber: string | null;
  preferredContactMethod: string | null;
  roleCategory: string | null;
  talentPersona: string | null;
  availableInMonths: number | null;
  companyWebsite: string | null;
  userTypes: string[];
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();
  public isAuthenticated$!: Observable<{ isAuthenticated: boolean }>; // will be assigned in constructor
  private accountStatusSynced = false;

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private router: Router,
    private http: HttpClient
  ) {
    console.log('AuthService constructor - initializing...');
    this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

    // Subscribe to user data changes
    this.oidcSecurityService.userData$.subscribe(userData => {
      console.log('userData$ changed:', userData);
      this.userDataSubject.next(userData?.userData);
      if (userData?.userData) {
        this.syncCurrentUserStatus();
      }
    });

    // Check authentication status on startup
    console.log('Calling checkAuth() on startup...');
    this.checkAuth().subscribe(isAuth => {
      console.log('checkAuth() result on startup:', isAuth);
      if (isAuth) {
          this.syncCurrentUserStatus();
      }
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

  public getMyProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${environment.apiUrl}/api/v1/accounts/me/profile`);
  }

  private syncCurrentUserStatus(): void {
    if (this.accountStatusSynced) {
      return;
    }

    this.http.get<void>(`${environment.apiUrl}/api/v1/accounts/premium-status`).subscribe({
      next: () => {
        this.accountStatusSynced = true;
      },
      error: error => console.error('Failed to sync current user status:', error)
    });
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

  public getUserPersona(): string | null {
    const userData = this.userDataSubject.value;
    const candidate = userData?.candidate ?? userData?.applicant ?? userData?.profile ?? userData;
    const rawPersona =
      candidate?.talentPersona ??
      candidate?.talent_persona ??
      candidate?.persona ??
      candidate?.userPersona ??
      userData?.talentPersona ??
      userData?.talent_persona ??
      userData?.persona ??
      userData?.userPersona ??
      this.getStoredPersona();

    if (!rawPersona) {
      return null;
    }

    const normalized = String(rawPersona).trim();
    const valid = ['PASSIVE_PROSPECT', 'WARM_LEAD', 'ACTIVE_JOB_SEEKER'];
    return valid.includes(normalized) ? normalized : null;
  }

  public setUserPersona(persona: string | null): void {
    if (!persona) {
      localStorage.removeItem('more.user.persona');
      return;
    }

    const valid = ['PASSIVE_PROSPECT', 'WARM_LEAD', 'ACTIVE_JOB_SEEKER'];
    const normalized = valid.includes(persona) ? persona : null;

    if (!normalized) {
      localStorage.removeItem('more.user.persona');
      return;
    }

    localStorage.setItem('more.user.persona', normalized);
    const current = this.userDataSubject.value ?? {};
    this.userDataSubject.next({
      ...current,
      talentPersona: normalized,
      persona: normalized
    });
  }

  public getUserAvailabilityInMonths(): number {
    const stored = Number(localStorage.getItem('more.user.availableInMonths'));
    if (!Number.isFinite(stored) || stored < 1 || stored > 12) {
      return 3;
    }

    return stored;
  }

  public setUserAvailabilityInMonths(months: number | null): void {
    if (months === null || !Number.isFinite(months) || months < 1 || months > 12) {
      localStorage.removeItem('more.user.availableInMonths');
      return;
    }

    localStorage.setItem('more.user.availableInMonths', String(months));
    const current = this.userDataSubject.value ?? {};
    this.userDataSubject.next({
      ...current,
      availableInMonths: months
    });
  }

  private getStoredPersona(): string | null {
    const stored = localStorage.getItem('more.user.persona');
    if (!stored) {
      return null;
    }

    return ['PASSIVE_PROSPECT', 'WARM_LEAD', 'ACTIVE_JOB_SEEKER'].includes(stored) ? stored : null;
  }

  public hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
}