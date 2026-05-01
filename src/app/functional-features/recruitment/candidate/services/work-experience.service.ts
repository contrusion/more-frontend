import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkExperience, CreateWorkExperienceRequest, UpdateWorkExperienceRequest } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkExperienceService {
  private readonly base = `${environment.apiUrl}/api/candidates/work-experience`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WorkExperience[]> {
    return this.http.get<WorkExperience[]>(this.base);
  }

  create(request: CreateWorkExperienceRequest): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(this.base, request);
  }

  update(id: string, request: UpdateWorkExperienceRequest): Observable<WorkExperience> {
    return this.http.patch<WorkExperience>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
