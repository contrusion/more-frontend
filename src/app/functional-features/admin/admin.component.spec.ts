import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminComponent } from './admin.component';
import { MlPromptService } from './ml-prompt/ml-prompt.service';
import { FeatureFlagsService } from '../../shared/services/feature-flags.service';

describe('AdminComponent', () => {
  let fixture: ComponentFixture<AdminComponent>;
  let router: Router;
  let service: jasmine.SpyObj<MlPromptService>;
  let featureFlags: jasmine.SpyObj<FeatureFlagsService>;
  const unreviewedCount = signal(0);

  const routes = ['dashboard', 'users', 'companies', 'challenges', 'outreach-ml', 'ml-prompt', 'ml-unknown-review']
    .map(path => ({ path: `admin/${path}`, children: [] }));

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', ['getUnknownSummary'], { unreviewedCount });
    unreviewedCount.set(0);
    service.getUnknownSummary.and.returnValue(of({ unreviewedCount: 0 }));
    featureFlags = jasmine.createSpyObj<FeatureFlagsService>('FeatureFlagsService', ['isInteractionsEventsEnabled']);
    featureFlags.isInteractionsEventsEnabled.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideRouter(routes), { provide: FeatureFlagsService, useValue: featureFlags }]
    })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
  });

  const rail = () => fixture.nativeElement.querySelector('.admin-nav') as HTMLElement | null;
  const railLabels = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.admin-nav .nav-item span:first-of-type') as NodeListOf<HTMLElement>)
      .map(element => element.textContent?.trim());
  const badge = () => fixture.nativeElement.querySelector('.nav-badge') as HTMLElement | null;

  async function goTo(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  it('loads the unreviewed count when it opens', () => {
    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('refreshes the count after each navigation', async () => {
    service.getUnknownSummary.calls.reset();

    await goTo('/admin/ml-prompt');

    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('shows only the Platform Operations pages in the rail on an ML page', async () => {
    await goTo('/admin/ml-prompt');

    expect(railLabels()).toEqual(['Companies', 'Challenges', 'ML Data', 'Prompt', 'Review', 'Events']);
  });

  it('hides Events from the rail while the events flag is off', async () => {
    featureFlags.isInteractionsEventsEnabled.and.returnValue(false);

    await goTo('/admin/ml-prompt');

    expect(railLabels()).toEqual(['Companies', 'Challenges', 'ML Data', 'Prompt', 'Review']);
  });

  it('has no rail on the Overview page', async () => {
    await goTo('/admin/dashboard');

    expect(rail()).toBeNull();
  });

  it('has no rail on User Management pages', async () => {
    await goTo('/admin/users');

    expect(rail()).toBeNull();
  });

  it('marks the current page active and navigates to a rail page', async () => {
    await goTo('/admin/ml-prompt');

    expect(fixture.componentInstance.isActive('/admin/ml-prompt')).toBeTrue();
    expect(fixture.componentInstance.isActive('/admin/companies')).toBeFalse();

    fixture.componentInstance.navigate('/admin/companies');
    await fixture.whenStable();

    expect(router.url).toBe('/admin/companies');
  });

  it('shows no badge when nothing is waiting for review', async () => {
    await goTo('/admin/ml-prompt');

    expect(badge()).toBeNull();
  });

  it('shows how many messages are waiting for review', async () => {
    await goTo('/admin/ml-prompt');
    unreviewedCount.set(4);
    fixture.detectChanges();

    expect(badge()?.textContent?.trim()).toBe('4');
  });

  it('caps a large count', async () => {
    await goTo('/admin/ml-prompt');
    unreviewedCount.set(250);
    fixture.detectChanges();

    expect(badge()?.textContent?.trim()).toBe('99+');
  });
});
