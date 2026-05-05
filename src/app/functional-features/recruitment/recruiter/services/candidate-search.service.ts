import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateClass, CandidateSearchPage, ExperienceGroup } from '../../candidate/models/goal.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CandidateSearchService {
  private readonly base = `${environment.apiUrl}/api/recruiters`;

  constructor(private http: HttpClient) {}

  searchCandidates(
    classFilter: CandidateClass | null,
    experienceGroup: ExperienceGroup | null,
    page = 0,
    size = 20
  ): Observable<CandidateSearchPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (classFilter) {
      params = params.set('candidateClass', classFilter);
    }
    if (experienceGroup) {
      params = params.set('experienceGroup', experienceGroup);
    }

    return this.http.get<CandidateSearchPage>(`${this.base}/candidates`, { params });
  }
}
