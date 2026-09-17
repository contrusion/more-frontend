import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkExperienceComponent } from './work-experience.component';
import { WorkExperienceService } from '../services/work-experience.service';

describe('WorkExperienceComponent', () => {
  let component: WorkExperienceComponent;
  let fixture: ComponentFixture<WorkExperienceComponent>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2025-01-01'));

    const service = jasmine.createSpyObj('WorkExperienceService', ['getAll', 'create', 'update', 'delete']);
    service.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [WorkExperienceComponent],
      providers: [{ provide: WorkExperienceService, useValue: service }]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkExperienceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should calculate average tenure and big-company count from work history', () => {
    component.items = [
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
    ];

    expect(component.averageTenureMonths()).toBe(12);
    expect(component.totalBigCompanies()).toBe(2);
    expect(component.formatTenure(12)).toBe('1y');
  });
});
