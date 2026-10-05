import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminCompanyRow {
  id: string;
  name: string;
  website: string;
  industry: string | null;
  headquarters: string | null;
  websiteStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminCompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/companies`;

  listCompanies(): Observable<AdminCompanyRow[]> {
    return this.http.get<AdminCompanyRow[]>(this.baseUrl);
  }
}
