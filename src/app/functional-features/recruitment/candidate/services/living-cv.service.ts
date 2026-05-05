import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LivingCv, PublicLivingCv } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LivingCvService {
  private readonly base = `${environment.apiUrl}/api/candidates`;

  constructor(private http: HttpClient) {}

  getLivingCv(): Observable<LivingCv> {
    return this.http.get<LivingCv>(`${this.base}/living-cv`);
  }

  getPublicLivingCv(alias: string): Observable<PublicLivingCv> {
    return this.http.get<PublicLivingCv>(`${this.base}/public/${encodeURIComponent(alias)}/living-cv`);
  }
}
