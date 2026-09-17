import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Challenge,
  ChallengeImportResult,
  ChallengeStats,
  ChallengeStatusUpdateRequest,
  CreateChallengeRequest,
  UpdateChallengeRequest
} from './challenge.model';

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private readonly base = `${environment.apiUrl}/api/v1/admin/challenges`;

  constructor(private http: HttpClient) {}

  getAllChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(this.base);
  }

  getChallengeById(id: string): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.base}/${id}`);
  }

  createChallenge(request: CreateChallengeRequest): Observable<Challenge> {
    return this.http.post<Challenge>(this.base, request);
  }

  updateChallenge(id: string, request: UpdateChallengeRequest): Observable<Challenge> {
    return this.http.put<Challenge>(`${this.base}/${id}`, request);
  }

  updateChallengeStatus(id: string, request: ChallengeStatusUpdateRequest): Observable<Challenge> {
    return this.http.patch<Challenge>(`${this.base}/${id}/status`, request);
  }

  cloneChallenge(id: string): Observable<Challenge> {
    return this.http.post<Challenge>(`${this.base}/${id}/clone`, {});
  }

  getChallengeStats(id: string): Observable<ChallengeStats> {
    return this.http.get<ChallengeStats>(`${this.base}/${id}/stats`);
  }

  importFromCsv(file: File): Observable<ChallengeImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ChallengeImportResult>(`${this.base}/import`, formData);
  }
}
