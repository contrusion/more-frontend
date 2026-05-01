import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecruitmentDatasetService } from './recruitment-dataset.service';
import { environment } from '../../../../environments/environment';

describe('RecruitmentDatasetService', () => {
  let service: RecruitmentDatasetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecruitmentDatasetService]
    });
    service = TestBed.inject(RecruitmentDatasetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export dataset', () => {
    const mockResponse = {
      userId: 'test-user',
      exportedAt: '2026-02-09T10:00:00',
      totalEmails: 5,
      emails: [],
      errors: [],
      success: true,
      stats: {
        inboxCount: 3,
        sentCount: 2,
        withAttachments: 1,
        avgBodyLength: 500,
        oldestEmail: '2025-01-01T00:00:00',
        newestEmail: '2026-02-09T09:00:00'
      }
    };

    service.exportDataset({ sinceDays: 365 }).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.totalEmails).toBe(5);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/email/dataset/export`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should preview dataset', () => {
    const mockResponse = {
      userId: 'test-user',
      exportedAt: '2026-02-09T10:00:00',
      totalEmails: 10,
      emails: [],
      errors: [],
      success: true,
      stats: {
        inboxCount: 7,
        sentCount: 3,
        withAttachments: 2,
        avgBodyLength: 450,
        oldestEmail: '2026-01-10T00:00:00',
        newestEmail: '2026-02-09T09:00:00'
      }
    };

    service.previewDataset(30).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/email/dataset/preview?sinceDays=30`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
