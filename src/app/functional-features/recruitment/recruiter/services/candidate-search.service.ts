import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateSearchPage, ExperienceGroup, MarketReadinessTier } from '../../candidate/models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CandidateSearchService {
  private readonly base = `${environment.apiUrl}/api/recruiters`;

  constructor(private http: HttpClient) {}

  searchCandidates(
    tierFilter: MarketReadinessTier | null,
    experienceGroup: ExperienceGroup | null,
    page = 0,
    size = 20,
    keyword: string | null = null,
    roleCategory: string | null = null,
    industry: string | null = null
  ): Observable<CandidateSearchPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (tierFilter) {
      params = params.set('tierFilter', tierFilter);
    }
    if (experienceGroup) {
      params = params.set('experienceGroup', experienceGroup);
    }
    if (keyword) {
      params = params.set('keyword', keyword.trim());
    }
    if (roleCategory) {
      params = params.set('roleCategory', roleCategory);
    }
    if (industry) {
      params = params.set('industry', industry.trim());
    }

    return this.http.get<CandidateSearchPage>(`${this.base}/candidates`, { params });
  }
}
