import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LivingCvComponent } from './living-cv.component';
import { LivingCvService } from '../services/living-cv.service';

describe('LivingCvComponent', () => {
  let component: LivingCvComponent;
  let fixture: ComponentFixture<LivingCvComponent>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2025-01-01'));

    const service = jasmine.createSpyObj('LivingCvService', ['getLivingCv']);
    service.getLivingCv.and.returnValue(of({
      profile: {
        firstName: 'Jane',
        lastName: 'Doe',
        jobTitle: 'Engineer',
        industry: 'Tech',
        biography: 'Built product teams',
        publicAlias: 'jdoe',
        profileImageUrl: null,
        linkedinUrl: null,
        portfolioUrl: null,
      },
      marketReadinessTier: 'GOLD',
      isAllStar: false,
      lastUpdated: '2024-12-31',
      stats: {
        completedGoals: 2,
        totalGoals: 4,
        totalMilestones: 6,
        verifiedProofItems: 4,
      },
      workExperience: [
        {
          id: '1',
          companyName: 'Alpha',
          jobTitle: 'Engineer',
          employmentType: 'FULL_TIME',
          startDate: '2023-01-01',
          endDate: '2024-01-01',
          isCurrent: false,
          location: 'Cape Town',
          description: null,
          gapReason: null,
          includeInCv: true,
          isBigCompany: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          companyName: 'Beta',
          jobTitle: 'Senior Engineer',
          employmentType: 'FULL_TIME',
          startDate: '2024-06-01',
          endDate: null,
          isCurrent: true,
          location: 'Johannesburg',
          description: null,
          gapReason: null,
          includeInCv: true,
          isBigCompany: true,
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '3',
          companyName: 'Gamma',
          jobTitle: 'Lead',
          employmentType: 'FULL_TIME',
          startDate: '2022-01-01',
          endDate: '2023-06-01',
          isCurrent: false,
          location: 'Remote',
          description: null,
          gapReason: null,
          includeInCv: true,
          isBigCompany: true,
          createdAt: '2022-01-01T00:00:00Z',
          updatedAt: '2023-06-01T00:00:00Z'
        }
      ],
      education: [],
      skills: [],
      certifications: [],
      goals: [],
      references: []
    }));

    await TestBed.configureTestingModule({
      imports: [LivingCvComponent],
      providers: [{ provide: LivingCvService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(LivingCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should calculate average tenure and big-company count from work history', () => {
    expect(component.averageTenureMonths()).toBe(12);
    expect(component.totalBigCompanies()).toBe(2);
    expect(component.formatTenure(12)).toBe('1y');
  });
});
