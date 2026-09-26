import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  CandidateSearchService,
  CandidateWatchRequestResponse,
} from '../services/candidate-search.service';
import { WatchlistDashboardComponent } from './watchlist-dashboard.component';

describe('WatchlistDashboardComponent', () => {
  let component: WatchlistDashboardComponent;
  let fixture: ComponentFixture<WatchlistDashboardComponent>;
  let candidateSearchService: jasmine.SpyObj<CandidateSearchService>;

  const watchRequests: CandidateWatchRequestResponse[] = [
    {
      id: 'wr-1',
      candidateAlias: 'alpha-river',
      status: 'PENDING',
      triggerReason: 'SKILL_GAP',
      recruiterNote: 'Please complete cloud certification',
      createdAt: '2026-09-01T00:00:00Z',
      expiresAt: '2026-12-01T00:00:00Z',
      respondedAt: null,
    },
    {
      id: 'wr-2',
      candidateAlias: 'nova-bird',
      status: 'ACCEPTED',
      triggerReason: 'TIMING_GAP',
      recruiterNote: null,
      createdAt: '2026-08-15T00:00:00Z',
      expiresAt: '2026-11-15T00:00:00Z',
      respondedAt: '2026-08-20T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    candidateSearchService = jasmine.createSpyObj('CandidateSearchService', ['getMyWatchRequests']);
    candidateSearchService.getMyWatchRequests.and.returnValue(of(watchRequests));

    await TestBed.configureTestingModule({
      imports: [WatchlistDashboardComponent],
      providers: [{ provide: CandidateSearchService, useValue: candidateSearchService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load watch requests on init', () => {
    expect(candidateSearchService.getMyWatchRequests).toHaveBeenCalled();
    expect(component.requests().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should filter requests by selected status', () => {
    component.setStatusFilter('ACCEPTED');

    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].id).toBe('wr-2');
  });

  it('should render readable watch reason labels', () => {
    expect(component.watchReasonLabel('EXPERIENCE_GAP')).toBe('Experience Gap');
  });
});
