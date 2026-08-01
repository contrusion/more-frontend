import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type AccountType = 'APPLICANT' | 'RECRUITER' | 'HIRING_MANAGER' | 'ADMIN' | 'EMPLOYER';

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userTypes: AccountType[];
  premium: boolean;
  enabled: boolean;
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
}

export interface AdminUserPage {
  content: AdminUserRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  group: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  dateOfBirth: string | null;
  userTypes: AccountType[];
  premium: boolean;
  enabled: boolean;
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
  company: string | null;
  jobsPosted: number | null;
  suspendReason: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly base = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getUser(userId: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.base}/users/${userId}`);
  }

  listUsers(opts: {
    page?: number;
    size?: number;
    types?: AccountType[];
    premium?: boolean | null;
    search?: string;
  } = {}): Observable<AdminUserPage> {
    let params = new HttpParams()
      .set('page', (opts.page ?? 0).toString())
      .set('size', (opts.size ?? 20).toString());

    if (opts.types && opts.types.length > 0) {
      opts.types.forEach(t => { params = params.append('types', t); });
    }
    if (opts.premium != null) {
      params = params.set('premium', opts.premium.toString());
    }
    if (opts.search) {
      params = params.set('search', opts.search);
    }

    return this.http.get<AdminUserPage>(`${this.base}/users`, { params });
  }

  updateUserStatus(userId: string, enabled: boolean, reason?: string): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${userId}/status`, { enabled, reason: reason ?? null });
  }
}
