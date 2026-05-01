import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Education, CreateEducationRequest, UpdateEducationRequest } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EducationService {
  private readonly base = `${environment.apiUrl}/api/candidates/education`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Education[]> {
    return this.http.get<Education[]>(this.base);
  }

  create(request: CreateEducationRequest): Observable<Education> {
    return this.http.post<Education>(this.base, request);
  }

  update(id: string, request: UpdateEducationRequest): Observable<Education> {
    return this.http.patch<Education>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
