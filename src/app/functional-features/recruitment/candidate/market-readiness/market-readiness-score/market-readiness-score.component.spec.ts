import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MarketReadinessScoreComponent } from './market-readiness-score.component';
import { MarketReadinessService } from '../../services/market-readiness.service';

describe('MarketReadinessScoreComponent', () => {
  let component: MarketReadinessScoreComponent;
  let fixture: ComponentFixture<MarketReadinessScoreComponent>;

  beforeEach(async () => {
    const service = jasmine.createSpyObj('MarketReadinessService', ['getMyMarketReadiness']);
    service.getMyMarketReadiness.and.returnValue(of({
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
      nextSteps: [{ action: 'Add a certification', potentialPoints: 100 }],
      pointsHistory: [{
        category: 'TOTAL',
        delta: 120,
        triggeredBy: 'US_P2_VIEW',
        createdAt: '2026-09-17T09:30:00',
        description: 'Score recalculated'
      }]
    }));

    await TestBed.configureTestingModule({
      imports: [MarketReadinessScoreComponent],
      providers: [{ provide: MarketReadinessService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketReadinessScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose the tier path from current to next tier', () => {
    expect(component.tierSteps().map(step => step.label)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum']);
    expect(component.nextTierLabel()).toBe('Gold');
  });
});
