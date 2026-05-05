import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ApplyRequest, JobFeedItem, MyApplication } from '../models/opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly base = `${environment.apiUrl}/api/v1/job-applications`;

  constructor(private readonly http: HttpClient) {}

  getFeed(): Observable<JobFeedItem[]> {
    return this.http.get<JobFeedItem[]>(`${this.base}/feed`);
  }

  apply(jobAdId: string, request?: ApplyRequest): Observable<MyApplication> {
    return this.http.post<MyApplication>(`${this.base}/${jobAdId}/apply`, request ?? {});
  }

  getMyApplications(): Observable<MyApplication[]> {
    return this.http.get<MyApplication[]>(`${this.base}/my-applications`);
  }
}
