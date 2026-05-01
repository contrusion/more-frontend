import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateSkill, AddSkillRequest, UpdateSkillRequest } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CandidateSkillService {
  private readonly base = `${environment.apiUrl}/api/candidates/skills`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CandidateSkill[]> {
    return this.http.get<CandidateSkill[]>(this.base);
  }

  add(request: AddSkillRequest): Observable<CandidateSkill> {
    return this.http.post<CandidateSkill>(this.base, request);
  }

  update(id: string, request: UpdateSkillRequest): Observable<CandidateSkill> {
    return this.http.patch<CandidateSkill>(`${this.base}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
