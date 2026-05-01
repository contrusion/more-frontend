import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateReference, CreateCandidateReferenceRequest, UpdateCandidateReferenceRequest } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReferenceService {
  private readonly base = `${environment.apiUrl}/api/candidates/references`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CandidateReference[]> {
    return this.http.get<CandidateReference[]>(this.base);
  }

  create(request: CreateCandidateReferenceRequest): Observable<CandidateReference> {
    return this.http.post<CandidateReference>(this.base, request);
  }

  update(id: string, request: UpdateCandidateReferenceRequest): Observable<CandidateReference> {
    return this.http.patch<CandidateReference>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
