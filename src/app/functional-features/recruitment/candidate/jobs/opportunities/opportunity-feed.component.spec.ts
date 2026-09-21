import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { OpportunityFeedComponent } from './opportunity-feed.component';
import { OpportunityService } from '../services/opportunity.service';
import { JobFeedItem } from '../models/opportunity.model';

describe('OpportunityFeedComponent', () => {
  let component: OpportunityFeedComponent;
  let fixture: ComponentFixture<OpportunityFeedComponent>;
  let opportunityService: jasmine.SpyObj<OpportunityService>;

  const baseJob: JobFeedItem = {
    id: 'job-123',
    title: 'Senior Frontend Engineer',
    location: 'Cape Town',
    jobType: 'FULL_TIME',
    experienceLevel: 'MID_SENIOR',
    companyName: 'Acme',
    skillNames: ['Angular'],
    preferredCertifications: [],
    alreadyApplied: false,
    applicationStatus: undefined,
    closingDate: '2026-12-31',
    matchScore: 90,
    matchThreshold: 80,
  };

  beforeEach(async () => {
    opportunityService = jasmine.createSpyObj('OpportunityService', ['getFeed', 'apply', 'withdraw']);
    opportunityService.getFeed.and.returnValue(of([baseJob]));
    opportunityService.apply.and.returnValue(of({} as any));
    opportunityService.withdraw.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [OpportunityFeedComponent],
      providers: [
        { provide: OpportunityService, useValue: opportunityService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should treat reviewed and screening statuses as active applications so the role stays unavailable', () => {
    const reviewedJob = { ...baseJob, alreadyApplied: true, applicationStatus: 'REVIEWED' };
    const screeningJob = { ...baseJob, alreadyApplied: true, applicationStatus: 'SCREENING' };

    expect(component.hasActiveApplication(reviewedJob)).toBeTrue();
    expect(component.hasActiveApplication(screeningJob)).toBeTrue();
    expect(component.isReadyToApply(reviewedJob)).toBeFalse();
    expect(component.isReadyToApply(screeningJob)).toBeFalse();
  });

  it('should allow reapplication only after a withdrawal, not a rejection', () => {
    const withdrawnJob = { ...baseJob, alreadyApplied: true, applicationStatus: 'WITHDRAWN' };
    const rejectedJob = { ...baseJob, alreadyApplied: true, applicationStatus: 'REJECTED' };

    expect(component.hasActiveApplication(withdrawnJob)).toBeFalse();
    expect(component.hasActiveApplication(rejectedJob)).toBeFalse();
    expect(component.isReadyToApply(withdrawnJob)).toBeTrue();
    expect(component.isReadyToApply(rejectedJob)).toBeFalse();
    expect(component.isRejected(rejectedJob)).toBeTrue();
  });
});
