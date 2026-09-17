import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChallengeService } from './challenge.service';
import { environment } from '../../../../environments/environment';
import { Challenge, ChallengeStats } from './challenge.model';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/v1/admin/challenges`;

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
    status: 'DRAFT',
    active: false,
    milestoneSteps: [],
    rewards: [],
    createdAt: '2025-01-01T00:00:00',
    updatedAt: '2025-01-01T00:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChallengeService]
    });
    service = TestBed.inject(ChallengeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAllChallenges should GET the base URL', () => {
    service.getAllChallenges().subscribe(result => {
      expect(result).toEqual([mockChallenge]);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([mockChallenge]);
  });

  it('getChallengeById should GET the correct URL', () => {
    service.getChallengeById('ch-1').subscribe(result => {
      expect(result).toEqual(mockChallenge);
    });

    const req = httpMock.expectOne(`${base}/ch-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockChallenge);
  });

  it('createChallenge should POST to the base URL', () => {
    const request = {
      title: 'Sprint to Gold',
      description: null,
      category: 'SKILL_SPRINT' as const,
      durationDays: 30,
      trackingType: 'AUTO' as const,
      triggerEvent: null,
      completionCriteria: null,
      rewardPoints: 100,
      allStarPoints: 50,
      milestoneSteps: [],
      rewards: []
    };

    service.createChallenge(request).subscribe(result => {
      expect(result).toEqual(mockChallenge);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush(mockChallenge);
  });

  it('updateChallenge should PUT to the correct URL', () => {
    const request = {
      title: 'Updated',
      description: null,
      category: 'ACTIVITY' as const,
      durationDays: 14,
      trackingType: 'PROOF_REQUIRED' as const,
      triggerEvent: null,
      completionCriteria: null,
      rewardPoints: 50,
      allStarPoints: 25,
      milestoneSteps: [],
      rewards: []
    };

    service.updateChallenge('ch-1', request).subscribe(result => {
      expect(result).toEqual(mockChallenge);
    });

    const req = httpMock.expectOne(`${base}/ch-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockChallenge);
  });

  it('updateChallengeStatus should PATCH to the status URL', () => {
    service.updateChallengeStatus('ch-1', { status: 'ACTIVE' }).subscribe(result => {
      expect(result).toEqual(mockChallenge);
    });

    const req = httpMock.expectOne(`${base}/ch-1/status`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockChallenge);
  });

  it('cloneChallenge should POST to the clone URL', () => {
    service.cloneChallenge('ch-1').subscribe(result => {
      expect(result).toEqual(mockChallenge);
    });

    const req = httpMock.expectOne(`${base}/ch-1/clone`);
    expect(req.request.method).toBe('POST');
    req.flush(mockChallenge);
  });

  it('getChallengeStats should GET the stats URL', () => {
    const stats: ChallengeStats = {
      challengeId: 'ch-1',
      totalEnrolments: 0,
      completedEnrolments: 0,
      completionRate: 0,
      avgDaysToComplete: null,
      activeEnrolments: 0
    };

    service.getChallengeStats('ch-1').subscribe(result => {
      expect(result).toEqual(stats);
    });

    const req = httpMock.expectOne(`${base}/ch-1/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });
});
