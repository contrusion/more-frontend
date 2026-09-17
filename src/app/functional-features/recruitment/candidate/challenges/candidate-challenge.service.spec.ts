import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CandidateChallengeService } from './candidate-challenge.service';
import { environment } from '../../../../../environments/environment';
import { CandidateChallengeView, ChallengeProofSubmissionRequest } from './challenge.model';
import { ProofType } from '../models/goal.model';

describe('CandidateChallengeService', () => {
  let service: CandidateChallengeService;
  let httpMock: HttpTestingController;

  const base = environment.apiUrl;

  const mockChallenge: CandidateChallengeView = {
    id: 'ch-1',
    title: 'Log progress 10 weeks',
    description: 'Streak challenge',
    category: 'ACTIVITY',
    durationDays: 70,
    trackingType: 'AUTO',
    completionCriteria: '{"streakWeeks":10}',
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
    proofVerificationStatus: null
  };

  const enrolledChallenge: CandidateChallengeView = {
    ...mockChallenge,
    enrolmentId: 'enrol-1',
    enrolmentStatus: 'IN_PROGRESS'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CandidateChallengeService]
    });
    service = TestBed.inject(CandidateChallengeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAvailableChallenges should GET /api/challenges', () => {
    service.getAvailableChallenges().subscribe(result => {
      expect(result).toEqual([mockChallenge]);
    });
    const req = httpMock.expectOne(`${base}/api/challenges`);
    expect(req.request.method).toBe('GET');
    req.flush([mockChallenge]);
  });

  it('getMyEnrolments should GET /api/candidates/me/challenges', () => {
    service.getMyEnrolments().subscribe(result => {
      expect(result).toEqual([enrolledChallenge]);
    });
    const req = httpMock.expectOne(`${base}/api/candidates/me/challenges`);
    expect(req.request.method).toBe('GET');
    req.flush([enrolledChallenge]);
  });

  it('enrol should POST to /api/candidates/me/challenges/{id}/enrol', () => {
    service.enrol('ch-1').subscribe(result => {
      expect(result.enrolmentStatus).toBe('IN_PROGRESS');
    });
    const req = httpMock.expectOne(`${base}/api/candidates/me/challenges/ch-1/enrol`);
    expect(req.request.method).toBe('POST');
    req.flush(enrolledChallenge);
  });

  it('submitProof should POST to /api/candidates/me/challenges/{id}/proof', () => {
    const request: ChallengeProofSubmissionRequest = {
      proofType: ProofType.CERTIFICATE,
      proofTitle: 'AWS Cert',
      proofUrl: 'https://cert.example.com'
    };

    service.submitProof('ch-1', request).subscribe(result => {
      expect(result.enrolmentStatus).toBe('COMPLETED');
    });

    const req = httpMock.expectOne(`${base}/api/candidates/me/challenges/ch-1/proof`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ ...enrolledChallenge, enrolmentStatus: 'COMPLETED' });
  });
});
