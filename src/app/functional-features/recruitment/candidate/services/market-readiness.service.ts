import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarketReadinessBreakdown } from '../models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarketReadinessService {
  private readonly base = `${environment.apiUrl}/api/candidates/me`;

  constructor(private http: HttpClient) {}

  getMyMarketReadiness(): Observable<MarketReadinessBreakdown> {
    return this.http.get<MarketReadinessBreakdown>(`${this.base}/market-readiness`);
  }
}
