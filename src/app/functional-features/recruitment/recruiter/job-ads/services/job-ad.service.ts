import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  AvailableBenefit,
  AvailableSkill,
  JobAdvertisement,
  JobAdvertisementCreateRequest,
  JobAdvertisementUpdateRequest,
  JobApplicantListItem,
} from '../models/job-advertisement.model';

@Injectable({ providedIn: 'root' })
export class JobAdService {
  private readonly base = `${environment.apiUrl}/api/v1/job-advertisements`;
  private readonly jobApplicationsBase = `${environment.apiUrl}/api/v1/job-applications`;

  constructor(private http: HttpClient) {}

  getMyAds(): Observable<JobAdvertisement[]> {
    return this.http.get<JobAdvertisement[]>(`${this.base}/my-ads`);
  }

  getById(id: string): Observable<JobAdvertisement> {
    return this.http.get<JobAdvertisement>(`${this.base}/detail/${id}`);
  }

  getInterestedApplicants(jobAdvertisementId: string): Observable<JobApplicantListItem[]> {
    return this.http.get<JobApplicantListItem[]>(`${this.jobApplicationsBase}/job-ads/${jobAdvertisementId}/applicants`);
  }

  create(dto: JobAdvertisementCreateRequest): Observable<JobAdvertisement> {
    return this.http.post<JobAdvertisement>(`${this.base}`, dto);
  }

  update(id: string, dto: JobAdvertisementUpdateRequest): Observable<JobAdvertisement> {
    return this.http.patch<JobAdvertisement>(`${this.base}/${id}`, dto);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getAvailableSkills(): Observable<AvailableSkill[]> {
    return this.http.get<AvailableSkill[]>(`${this.base}/available-skills`);
  }

  getAvailableBenefits(): Observable<AvailableBenefit[]> {
    return this.http.get<AvailableBenefit[]>(`${this.base}/available-benefits`);
  }
}
