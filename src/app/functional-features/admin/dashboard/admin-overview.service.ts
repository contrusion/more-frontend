import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminOverview {
  totalUsers: number;
  activeThisWeek: number;
  newLast30Days: number;
  totalJobAds: number;
  activeJobAds: number;
  totalApplications: number;
  totalInteractions: number;
  activeInteractions: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOverviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/analytics/overview`;

  getOverview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(this.baseUrl);
  }
}
