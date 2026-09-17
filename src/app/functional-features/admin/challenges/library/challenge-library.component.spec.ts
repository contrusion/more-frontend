import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChallengeLibraryComponent } from './challenge-library.component';
import { ChallengeService } from '../challenge.service';
import { Challenge } from '../challenge.model';
import { RouterTestingModule } from '@angular/router/testing';

describe('ChallengeLibraryComponent', () => {
  let component: ChallengeLibraryComponent;
  let fixture: ComponentFixture<ChallengeLibraryComponent>;
  let mockChallengeService: jasmine.SpyObj<ChallengeService>;
  let router: Router;

  const mockChallenge: Challenge = {
    id: 'ch-1',
    title: 'Sprint to Gold',
    description: null,
    category: 'SKILL_SPRINT',
    durationDays: 30,
    trackingType: 'AUTO',
    triggerEvent: null,
    completionCriteria: null,
    rewardPoints: 100,
    allStarPoints: 50,
    status: 'ACTIVE',
    active: true,
    milestoneSteps: [],
    rewards: [],
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00'
  };

  beforeEach(async () => {
    mockChallengeService = jasmine.createSpyObj('ChallengeService', [
      'getAllChallenges', 'updateChallengeStatus', 'cloneChallenge'
    ]);
    mockChallengeService.getAllChallenges.and.returnValue(of([mockChallenge]));

    await TestBed.configureTestingModule({
      imports: [ChallengeLibraryComponent, RouterTestingModule]
    })
    .overrideProvider(ChallengeService, { useValue: mockChallengeService })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengeLibraryComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should load challenges on init', () => {
    expect(component.challenges()).toEqual([mockChallenge]);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should show error when load fails', () => {
    mockChallengeService.getAllChallenges.and.returnValue(throwError(() => new Error('Network error')));
    component.load();
    fixture.detectChanges();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should filter challenges by status', () => {
    component.applyFilter('DRAFT');
    expect(component.filteredChallenges()).toEqual([]);

    component.applyFilter('ACTIVE');
    expect(component.filteredChallenges()).toEqual([mockChallenge]);

    component.applyFilter('ALL');
    expect(component.filteredChallenges()).toEqual([mockChallenge]);
  });

  it('should navigate to create on navigateToCreate', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToCreate();
    expect(spy).toHaveBeenCalledWith(['/admin/challenges/new']);
  });

  it('should navigate to edit on navigateToEdit', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToEdit('ch-1');
    expect(spy).toHaveBeenCalledWith(['/admin/challenges', 'ch-1', 'edit']);
  });

  it('should update challenge list on retire success', () => {
    const retiredChallenge = { ...mockChallenge, status: 'RETIRED' as const, active: false };
    mockChallengeService.updateChallengeStatus.and.returnValue(of(retiredChallenge));

    component.retire(mockChallenge);

    expect(component.challenges()).toContain(retiredChallenge);
  });

  it('should set error on retire failure', () => {
    mockChallengeService.updateChallengeStatus.and.returnValue(throwError(() => new Error()));

    component.retire(mockChallenge);

    expect(component.error()).toBeTruthy();
  });

  it('should add cloned challenge to list on clone success', () => {
    const clonedChallenge: Challenge = { ...mockChallenge, id: 'ch-2', title: 'Copy of Sprint to Gold', status: 'DRAFT', active: false };
    mockChallengeService.cloneChallenge.and.returnValue(of(clonedChallenge));

    component.clone(mockChallenge);

    expect(component.challenges()[0]).toEqual(clonedChallenge);
  });

  it('getStatusSeverity should return correct severity for each status', () => {
    expect(component.getStatusSeverity('ACTIVE')).toBe('success');
    expect(component.getStatusSeverity('DRAFT')).toBe('info');
    expect(component.getStatusSeverity('RETIRED')).toBe('secondary');
  });
});
