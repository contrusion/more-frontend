import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { LivingCvService } from '../../candidate/services/living-cv.service';
import { JobAdApplicantsComponent } from './job-ad-applicants.component';
import { JobAdService } from './services/job-ad.service';
import { JobApplicantListItem } from './models/job-advertisement.model';

describe('JobAdApplicantsComponent', () => {
  let component: JobAdApplicantsComponent;
  let fixture: ComponentFixture<JobAdApplicantsComponent>;
  let jobAdService: jasmine.SpyObj<JobAdService>;
  let livingCvService: jasmine.SpyObj<LivingCvService>;

  const applicant: JobApplicantListItem = {
    applicationId: 'app-123',
    applicantId: 'candidate-123',
    publicAlias: 'alpha-sky',
    status: 'SUBMITTED',
    appliedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(async () => {
    jobAdService = jasmine.createSpyObj('JobAdService', ['getInterestedApplicants', 'updateApplicationStatus']);
    jobAdService.getInterestedApplicants.and.returnValue(of([]));
    jobAdService.updateApplicationStatus.and.returnValue(of({ status: 'SCREENING' }));

    livingCvService = jasmine.createSpyObj('LivingCvService', ['getPublicLivingCv']);
    livingCvService.getPublicLivingCv.and.returnValue(of({
      profile: { jobTitle: 'Senior Engineer', industry: 'Technology' },
      workExperience: [],
      skills: [],
      marketReadinessTier: 'GOLD',
      isAllStar: false,
      marketReadinessScore: 80,
      education: [],
      certifications: [],
      achievements: [],
      references: [],
      completeProfile: true,
    } as any));

    await TestBed.configureTestingModule({
      imports: [JobAdApplicantsComponent],
      providers: [
        { provide: JobAdService, useValue: jobAdService },
        { provide: LivingCvService, useValue: livingCvService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ jobAdId: 'job-ad-hitech-001' })),
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobAdApplicantsComponent);
    component = fixture.componentInstance;
    component.applicants.set([applicant]);
    fixture.detectChanges();
  });

  it('should mark the application as reviewed when the recruiter chooses View Application', () => {
    component.viewApplication(applicant);

    expect(jobAdService.updateApplicationStatus).toHaveBeenCalledWith('app-123', 'REVIEWED');
    expect(livingCvService.getPublicLivingCv).toHaveBeenCalledWith('alpha-sky');
    expect(component.modalOpen()).toBeTrue();
  });

  it('should allow the recruiter to proceed to screening from the candidate modal', () => {
    component.proceedToScreening(applicant);

    expect(jobAdService.updateApplicationStatus).toHaveBeenCalledWith('app-123', 'SCREENING', undefined);
    expect(component.modalError()).toBeNull();
  });

  it('should not change the status when a recruiter just opens the CV without choosing a decision', () => {
    const malformedApplicant = { ...applicant, applicationId: undefined } as unknown as JobApplicantListItem;

    component.openCv(applicant);
    component.openCv(malformedApplicant);

    expect(jobAdService.updateApplicationStatus).not.toHaveBeenCalled();
    expect(component.modalOpen()).toBeTrue();
    expect(livingCvService.getPublicLivingCv).toHaveBeenCalledWith('alpha-sky');
  });
});
