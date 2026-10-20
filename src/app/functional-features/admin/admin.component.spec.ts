import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminComponent } from './admin.component';
import { MlPromptService } from './ml-prompt/ml-prompt.service';

describe('AdminComponent', () => {
  let fixture: ComponentFixture<AdminComponent>;
  let service: jasmine.SpyObj<MlPromptService>;
  const unreviewedCount = signal(0);

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', ['getUnknownSummary'], { unreviewedCount });
    unreviewedCount.set(0);
    service.getUnknownSummary.and.returnValue(of({ unreviewedCount: 0 }));

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideRouter([{ path: 'admin/dashboard', children: [] }, { path: 'admin/ml-unknown', children: [] }])]
    })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();
  });

  const badge = () => fixture.nativeElement.querySelector('.nav-badge') as HTMLElement | null;

  it('loads the unreviewed count when it opens', () => {
    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('shows no badge when nothing is waiting for review', () => {
    expect(badge()).toBeNull();
  });

  it('shows how many messages are waiting for review', () => {
    unreviewedCount.set(4);
    fixture.detectChanges();

    expect(badge()?.textContent?.trim()).toBe('4');
  });

  it('caps a large count', () => {
    unreviewedCount.set(250);
    fixture.detectChanges();

    expect(badge()?.textContent?.trim()).toBe('99+');
  });

  it('refreshes the count after each navigation', async () => {
    service.getUnknownSummary.calls.reset();

    await TestBed.inject(Router).navigateByUrl('/admin/ml-unknown');

    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('marks the current section active and navigates to a section', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin/ml-unknown');

    expect(fixture.componentInstance.isActive('ml-unknown')).toBeTrue();
    expect(fixture.componentInstance.isActive('dashboard')).toBeFalse();

    fixture.componentInstance.navigate('dashboard');
    await fixture.whenStable();

    expect(router.url).toBe('/admin/dashboard');
  });
});
