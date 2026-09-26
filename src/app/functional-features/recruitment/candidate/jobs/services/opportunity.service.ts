import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  ApplyRequest,
  CandidateWatchRequest,
  JobFeedItem,
  MyApplication,
  RespondToWatchRequestPayload
} from '../models/opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly base = `${environment.apiUrl}/api/v1/job-applications`;
  private readonly watchRequestBase = `${environment.apiUrl}/api/candidates/me/watch-requests`;

  constructor(private readonly http: HttpClient) {}

  getFeed(): Observable<JobFeedItem[]> {
    return this.http.get<JobFeedItem[]>(`${this.base}/feed`);
  }

  apply(jobAdId: string, request?: ApplyRequest): Observable<MyApplication> {
    return this.http.post<MyApplication>(`${this.base}/${jobAdId}/apply`, request ?? {});
  }

  withdraw(jobAdId: string): Observable<MyApplication> {
    return this.http.post<MyApplication>(`${this.base}/${jobAdId}/withdraw`, {});
  }

  getMyApplications(): Observable<MyApplication[]> {
    return this.http.get<MyApplication[]>(`${this.base}/my-applications`);
  }

  getPendingWatchRequests(): Observable<CandidateWatchRequest[]> {
    return this.http.get<CandidateWatchRequest[]>(this.watchRequestBase);
  }

  respondToWatchRequest(
    watchRequestId: string,
    payload: RespondToWatchRequestPayload
  ): Observable<CandidateWatchRequest> {
    return this.http.patch<CandidateWatchRequest>(`${this.watchRequestBase}/${watchRequestId}`, payload);
  }
}
