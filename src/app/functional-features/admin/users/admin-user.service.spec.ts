import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminUserService, AdminUserDetail, AdminUserPage } from './admin-user.service';
import { environment } from '../../../../environments/environment';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/admin`;

  const mockDetail: AdminUserDetail = {
    id: 'u-1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith',
    phoneNumber: null, group: null, linkedinUrl: null, portfolioUrl: null,
    dateOfBirth: null, userTypes: ['APPLICANT'], premium: false, enabled: true,
    createdAt: '2024-01-01T00:00:00', lastLogin: null, loginCount: 0,
    company: null, jobsPosted: 0, suspendReason: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminUserService],
    });
    service = TestBed.inject(AdminUserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // --- getUser ---

  it('getUser_WhenIdProvided_SendsGetAndReturnsDetail', () => {
    service.getUser('u-1').subscribe(result => {
      expect(result).toEqual(mockDetail);
    });

    const req = http.expectOne(`${base}/users/u-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  // --- listUsers ---

  it('listUsers_WhenDefaultOptions_SendsGetWithPageParams', () => {
    const mockPage: AdminUserPage = {
      content: [mockDetail as any], totalElements: 1, totalPages: 1, number: 0, size: 20,
    };

    service.listUsers().subscribe(result => {
      expect(result.content.length).toBe(1);
      expect(result.totalElements).toBe(1);
    });

    const req = http.expectOne(r => r.url === `${base}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  it('listUsers_WhenFiltersProvided_SendsFilterParams', () => {
    service.listUsers({ types: ['RECRUITER'], premium: true, search: 'bob' }).subscribe();

    const req = http.expectOne(r => r.url === `${base}/users`);
    expect(req.request.params.get('types')).toBe('RECRUITER');
    expect(req.request.params.get('premium')).toBe('true');
    expect(req.request.params.get('search')).toBe('bob');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  // --- updateUserStatus ---

  it('updateUserStatus_WhenSuspending_SendsPatchWithEnabledFalseAndReason', () => {
    const suspended = { ...mockDetail, enabled: false, suspendReason: 'Policy violation' };

    service.updateUserStatus('u-1', false, 'Policy violation').subscribe(result => {
      expect(result.enabled).toBeFalse();
      expect(result.suspendReason).toBe('Policy violation');
    });

    const req = http.expectOne(`${base}/users/u-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ enabled: false, reason: 'Policy violation' });
    req.flush(suspended);
  });

  it('updateUserStatus_WhenReactivating_SendsPatchWithEnabledTrueAndNullReason', () => {
    const reactivated = { ...mockDetail, enabled: true, suspendReason: null };

    service.updateUserStatus('u-1', true).subscribe(result => {
      expect(result.enabled).toBeTrue();
      expect(result.suspendReason).toBeNull();
    });

    const req = http.expectOne(`${base}/users/u-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ enabled: true, reason: null });
    req.flush(reactivated);
  });
});
