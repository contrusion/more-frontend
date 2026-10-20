import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NavDrawerComponent } from './nav-drawer.component';
import { AuthService } from '../../../none-functional-features/authentication-and-authorization/services/auth.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';

describe('NavDrawerComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let featureFlags: jasmine.SpyObj<FeatureFlagsService>;

  function createComponent(roles: string[], interactionsEnabled: boolean): NavDrawerComponent {
    authService.hasRole.and.callFake((role: string) => roles.includes(role));
    featureFlags.isInteractionsEventsEnabled.and.returnValue(interactionsEnabled);

    const fixture = TestBed.createComponent(NavDrawerComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole', 'logout'], {
      userData$: of({ name: 'Test User' })
    });
    featureFlags = jasmine.createSpyObj<FeatureFlagsService>('FeatureFlagsService', ['isInteractionsEventsEnabled']);

    await TestBed.configureTestingModule({
      imports: [NavDrawerComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: FeatureFlagsService, useValue: featureFlags }
      ]
    }).compileComponents();
  });

  it('shows an Interactions section with its sub-pages for applicants', () => {
    const component = createComponent(['APPLICANT'], false);

    const section = component.visibleSections.find(s => s.id === 'interactions');

    expect(section?.label).toBe('Recruiter Leads');
    expect(section?.children.map(c => c.label)).toEqual(['Analytics', 'Leads', 'My Recruiters', 'Reconnect']);
    expect(section?.children.map(c => c.route)).toEqual([
      '/interactions/analytics',
      '/interactions/events',
      '/interactions/my-recruiters',
      '/interactions/reconnection'
    ]);
  });

  it('shows the Interactions section for recruiters', () => {
    const component = createComponent(['RECRUITER'], false);

    const section = component.visibleSections.find(s => s.id === 'interactions');

    expect(section?.label).toBe('Candidate Leads');
    expect(component.visibleSections.some(s => s.id === 'interactions')).toBeTrue();
  });

  it('does not show the Interactions section for admins', () => {
    const component = createComponent(['MO_ADMIN'], true);

    expect(component.visibleSections.some(s => s.id === 'interactions')).toBeFalse();
  });

  it('hides the admin Interactions links when the events flag is off', () => {
    const component = createComponent(['MO_ADMIN'], false);

    const platformOps = component.visibleSections.find(s => s.id === 'platform-ops');

    expect(platformOps?.children.map(c => c.route)).toEqual([
      '/admin/companies',
      '/admin/challenges',
      '/admin/outreach-ml',
      '/admin/ml-prompt',
      '/admin/ml-unknown-review'
    ]);
  });

  it('lists the ML prompt and review pages under Platform Operations for admins', () => {
    const component = createComponent(['MO_ADMIN'], true);

    const platformOps = component.visibleSections.find(s => s.id === 'platform-ops');

    expect(platformOps?.children.map(c => c.route)).toEqual(
      jasmine.arrayContaining(['/admin/ml-prompt', '/admin/ml-unknown-review'])
    );
  });

  it('only highlights Platform Operations on its own pages', () => {
    const component = createComponent(['MO_ADMIN'], true);
    const platformOps = component.visibleSections.find(s => s.id === 'platform-ops')!;

    component.currentUrl = '/admin/dashboard';
    expect(component.isSectionActive(platformOps)).toBeFalse();

    component.currentUrl = '/admin/users/42';
    expect(component.isSectionActive(platformOps)).toBeFalse();

    component.currentUrl = '/admin/ml-prompt';
    expect(component.isSectionActive(platformOps)).toBeTrue();

    component.currentUrl = '/admin/challenges/new';
    expect(component.isSectionActive(platformOps)).toBeTrue();
  });

  it('does not show Platform Operations to non-admins', () => {
    const component = createComponent(['RECRUITER'], true);

    expect(component.visibleSections.some(s => s.id === 'platform-ops')).toBeFalse();
  });

  it('shows the admin Interactions links when the events flag is on', () => {
    const component = createComponent(['MO_ADMIN'], true);

    const platformOps = component.visibleSections.find(s => s.id === 'platform-ops');

    expect(platformOps?.children.map(c => c.route)).toContain('/interactions/events');
  });
});
