import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MarketReadinessService } from './market-readiness.service';
import { environment } from '../../../../../environments/environment';
import { MarketReadinessBreakdown } from '../models/goal.model';

describe('MarketReadinessService', () => {
  let service: MarketReadinessService;
  let httpMock: HttpTestingController;

  const base = environment.apiUrl;

  const mockResponse: MarketReadinessBreakdown = {
    totalScore: 2400,
    marketReadinessTier: 'SILVER',
    isAllStar: false,
    nextTierThreshold: 3000,
    pointsToNextTier: 600,
    progressPercentToNextTier: 60,
    categories: [
      { category: 'PROFILE', earnedPoints: 200, maxPoints: 300 },
      { category: 'CAREER_DEPTH', earnedPoints: 800, maxPoints: 2000 },
      { category: 'CERTIFICATIONS', earnedPoints: 500, maxPoints: 500 },
      { category: 'SKILLS', earnedPoints: 400, maxPoints: 600 },
      { category: 'EXPERIENCE', earnedPoints: 500, maxPoints: 2000 }
    ],
    nextSteps: [
      { action: 'Add your salary expectation', potentialPoints: 100 }
    ],
    pointsHistory: [
      {
        category: 'TOTAL',
        delta: 120,
        triggeredBy: 'US_P2_VIEW',
        createdAt: '2026-09-17T09:30:00',
        description: 'Score recalculated'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MarketReadinessService]
    });

    service = TestBed.inject(MarketReadinessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMyMarketReadiness should GET /api/candidates/me/market-readiness', () => {
    service.getMyMarketReadiness().subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${base}/api/candidates/me/market-readiness`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
