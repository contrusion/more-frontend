import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LivingCv } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LivingCvService {
  private readonly base = `${environment.apiUrl}/api/candidates`;

  constructor(private http: HttpClient) {}

  getLivingCv(): Observable<LivingCv> {
    return this.http.get<LivingCv>(`${this.base}/living-cv`);
  }
}
