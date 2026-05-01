import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certification, CreateCertificationRequest, UpdateCertificationRequest } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificationService {
  private readonly base = `${environment.apiUrl}/api/candidates/certifications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Certification[]> {
    return this.http.get<Certification[]>(this.base);
  }

  create(request: CreateCertificationRequest): Observable<Certification> {
    return this.http.post<Certification>(this.base, request);
  }

  update(id: string, request: UpdateCertificationRequest): Observable<Certification> {
    return this.http.patch<Certification>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
