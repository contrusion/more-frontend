import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  CandidateSearchService,
  RecruiterWatchProgressResponse,
  RecruiterWatchlistEntryResponse,
} from '../services/candidate-search.service';
import { WatchlistDashboardComponent } from './watchlist-dashboard.component';

describe('WatchlistDashboardComponent', () => {
  let component: WatchlistDashboardComponent;
  let fixture: ComponentFixture<WatchlistDashboardComponent>;
  let candidateSearchService: jasmine.SpyObj<CandidateSearchService>;

  const watchlistEntries: RecruiterWatchlistEntryResponse[] = [
    {
      id: 'we-1',
      candidateAlias: 'alpha-river',
      triggerReason: 'SKILL_GAP',
      recruiterNote: 'Please complete cloud certification',
      suggestedFocusAreas: ['AWS Associate', 'System design'],
      acceptedAt: '2026-09-01T00:00:00Z',
      expiresAt: '2026-12-01T00:00:00Z',
    },
    {
      id: 'we-2',
      candidateAlias: 'nova-bird',
      triggerReason: 'TIMING_GAP',
      recruiterNote: null,
      suggestedFocusAreas: [],
      acceptedAt: '2026-08-15T00:00:00Z',
      expiresAt: '2026-11-15T00:00:00Z',
    },
  ];

  const watchProgress: Record<string, RecruiterWatchProgressResponse> = {
    'alpha-river': {
      candidateAlias: 'alpha-river',
      marketReadinessTier: 'SILVER',
      isAllStar: false,
      marketReadinessScore: 1820,
      completedGoals: 2,
      totalGoals: 4,
      completedMilestones: 5,
      totalMilestones: 8,
      goalProgressPercent: 50,
      milestoneProgressPercent: 63,
    },
    'nova-bird': {
      candidateAlias: 'nova-bird',
      marketReadinessTier: 'BRONZE',
      isAllStar: false,
      marketReadinessScore: 980,
      completedGoals: 1,
      totalGoals: 3,
      completedMilestones: 2,
      totalMilestones: 7,
      goalProgressPercent: 33,
      milestoneProgressPercent: 29,
    }
  };

  beforeEach(async () => {
    candidateSearchService = jasmine.createSpyObj('CandidateSearchService', ['getMyWatchlist', 'getWatchProgress']);
    candidateSearchService.getMyWatchlist.and.returnValue(of(watchlistEntries));
    candidateSearchService.getWatchProgress.and.callFake((alias: string) => of(watchProgress[alias]));

    await TestBed.configureTestingModule({
      imports: [WatchlistDashboardComponent],
      providers: [{ provide: CandidateSearchService, useValue: candidateSearchService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load watchlist entries on init', () => {
    expect(candidateSearchService.getMyWatchlist).toHaveBeenCalled();
    expect(candidateSearchService.getWatchProgress).toHaveBeenCalledWith('alpha-river');
    expect(candidateSearchService.getWatchProgress).toHaveBeenCalledWith('nova-bird');
    expect(component.entries().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should expose active entries from computed state', () => {
    expect(component.activeEntries().length).toBe(2);
    expect(component.activeEntries()[0].id).toBe('we-1');
  });

  it('should render readable watch reason labels', () => {
    expect(component.watchReasonLabel('EXPERIENCE_GAP')).toBe('Experience Gap');
  });
});
