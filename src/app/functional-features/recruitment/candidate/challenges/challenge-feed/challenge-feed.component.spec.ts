import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { ChallengeFeedComponent } from './challenge-feed.component';
import { CandidateChallengeService } from '../candidate-challenge.service';
import { CandidateChallengeView, ChallengeProofSubmissionRequest } from '../challenge.model';
import { ProofType } from '../../models/goal.model';

describe('ChallengeFeedComponent', () => {
  let component: ChallengeFeedComponent;
  let fixture: ComponentFixture<ChallengeFeedComponent>;
  let mockService: jasmine.SpyObj<CandidateChallengeService>;

  const makeChallenge = (overrides: Partial<CandidateChallengeView> = {}): CandidateChallengeView => ({
    id: 'ch-1',
    title: 'Log progress 10 weeks',
    description: null,
    category: 'ACTIVITY',
    durationDays: 70,
    trackingType: 'AUTO',
    completionCriteria: null,
    rewardPoints: 80,
    allStarPoints: 40,
    milestoneSteps: [],
    enrolmentId: null,
    enrolmentStatus: null,
    progressSnapshot: null,
    enrolledAt: null,
    completedAt: null,
    pointsAwarded: 0,
    proofUrl: null,
    proofTitle: null,
    proofType: null,
    proofVerificationStatus: null,
    ...overrides
  });

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('CandidateChallengeService', [
      'getAvailableChallenges', 'enrol', 'submitProof'
    ]);
    mockService.getAvailableChallenges.and.returnValue(of([makeChallenge()]));

    await TestBed.configureTestingModule({
      imports: [ChallengeFeedComponent, RouterTestingModule]
    })
    .overrideProvider(CandidateChallengeService, { useValue: mockService })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengeFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load challenges on init', () => {
    expect(component.challenges()).toHaveSize(1);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should show error when load fails', () => {
    mockService.getAvailableChallenges.and.returnValue(throwError(() => new Error('error')));
    component.load();
    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
  });

  it('filteredChallenges should return all when filter is ALL', () => {
    component.setFilter('ALL');
    expect(component.filteredChallenges()).toHaveSize(1);
  });

  it('filteredChallenges should return only AVAILABLE when filter is AVAILABLE', () => {
    component.setFilter('AVAILABLE');
    expect(component.filteredChallenges()).toHaveSize(1);
  });

  it('filteredChallenges should return empty for IN_PROGRESS when none enrolled', () => {
    component.setFilter('IN_PROGRESS');
    expect(component.filteredChallenges()).toHaveSize(0);
  });

  it('onEnrol should update the challenge enrolment state', () => {
    const enrolled = makeChallenge({ enrolmentId: 'enrol-1', enrolmentStatus: 'IN_PROGRESS' });
    mockService.enrol.and.returnValue(of(enrolled));

    component.onEnrol('ch-1');
    expect(component.challenges()[0].enrolmentStatus).toBe('IN_PROGRESS');
  });

  it('onSubmitProof should update the challenge to COMPLETED', () => {
    const completed = makeChallenge({ enrolmentStatus: 'COMPLETED', pointsAwarded: 80 });
    mockService.submitProof.and.returnValue(of(completed));

    const request: ChallengeProofSubmissionRequest = {
      proofType: ProofType.CERTIFICATE,
      proofTitle: 'Cert',
      proofUrl: 'https://cert.example.com'
    };

    component.onSubmitProof({ challengeId: 'ch-1', request });
    expect(component.challenges()[0].enrolmentStatus).toBe('COMPLETED');
  });

  it('totalPoints should sum pointsAwarded across completed challenges', () => {
    const c1 = makeChallenge({ id: 'ch-1', enrolmentStatus: 'COMPLETED', pointsAwarded: 80 });
    const c2 = makeChallenge({ id: 'ch-2', enrolmentStatus: 'COMPLETED', pointsAwarded: 120 });
    mockService.getAvailableChallenges.and.returnValue(of([c1, c2]));
    component.load();
    fixture.detectChanges();
    expect(component.totalPoints()).toBe(200);
  });
});
