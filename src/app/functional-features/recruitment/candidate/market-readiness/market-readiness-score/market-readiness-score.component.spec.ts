import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MarketReadinessScoreComponent } from './market-readiness-score.component';
import { MarketReadinessService } from '../../services/market-readiness.service';

describe('MarketReadinessScoreComponent', () => {
  let component: MarketReadinessScoreComponent;
  let fixture: ComponentFixture<MarketReadinessScoreComponent>;
  const breakdown = {
    totalScore: 2400,
    marketReadinessTier: 'SILVER' as const,
    isAllStar: false,
    nextTierThreshold: 3000,
    pointsToNextTier: 600,
    progressPercentToNextTier: 60,
    categories: [
      { category: 'PROFILE' as const, earnedPoints: 200, maxPoints: 300 },
      { category: 'CAREER_DEPTH' as const, earnedPoints: 800, maxPoints: 2000 },
      { category: 'CERTIFICATIONS' as const, earnedPoints: 500, maxPoints: 500 },
      { category: 'SKILLS' as const, earnedPoints: 400, maxPoints: 600 },
      { category: 'EXPERIENCE' as const, earnedPoints: 500, maxPoints: 2000 }
    ],
    nextSteps: [{ action: 'Add a certification', potentialPoints: 100 }],
    pointsHistory: [{
      category: 'TOTAL' as const,
      delta: 120,
      triggeredBy: 'US_P2_VIEW',
      createdAt: '2026-09-17T09:30:00',
      description: 'Score recalculated'
    }]
  };

  beforeEach(async () => {
    const service = jasmine.createSpyObj('MarketReadinessService', ['getMyMarketReadiness']);
    service.getMyMarketReadiness.and.returnValue(of(breakdown));

    await TestBed.configureTestingModule({
      imports: [MarketReadinessScoreComponent],
      providers: [{ provide: MarketReadinessService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketReadinessScoreComponent);
    component = fixture.componentInstance;
    component.breakdown.set(breakdown);
    component.loading.set(false);
    fixture.detectChanges();
  });

  it('should expose the tier path from current to next tier', () => {
    expect(component.tierSteps().map(step => step.label)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum']);
    expect(component.nextTierLabel()).toBe('Gold');
  });

  it('should expose the strongest category and best next step for the page summary', () => {
    expect(component.leadingCategory()).toEqual({
      label: 'Certifications',
      earnedPoints: 500,
      maxPoints: 500,
      percent: 100
    });
    expect(component.primaryNextStep()).toEqual({ action: 'Add a certification', potentialPoints: 100 });
  });
});
