import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CandidateSearchPage, ExperienceGroup, MarketReadinessTier } from '../../candidate/models/goal.model';
import { environment } from '../../../../../environments/environment';

export type WatchReason = 'SKILL_GAP' | 'EXPERIENCE_GAP' | 'TIMING_GAP' | 'DOMAIN_GAP';

export interface CreateWatchRequestPayload {
  candidateAlias: string;
  triggerReason: WatchReason;
  recruiterNote?: string;
  suggestedFocusAreas?: string[];
}

export interface CandidateWatchRequestResponse {
  id: string;
  candidateAlias: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  triggerReason: WatchReason;
  recruiterNote: string | null;
  suggestedFocusAreas: string[];
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

export interface RecruiterWatchlistEntryResponse {
  id: string;
  candidateAlias: string;
  acceptedAt: string;
  expiresAt: string;
  triggerReason: WatchReason | null;
  recruiterNote: string | null;
  suggestedFocusAreas: string[];
}

export interface RecruiterWatchProgressResponse {
  candidateAlias: string;
  marketReadinessTier: MarketReadinessTier;
  isAllStar: boolean;
  marketReadinessScore: number;
  completedGoals: number;
  totalGoals: number;
  completedMilestones: number;
  totalMilestones: number;
  goalProgressPercent: number;
  milestoneProgressPercent: number;
}

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

  createWatchRequest(payload: CreateWatchRequestPayload): Observable<CandidateWatchRequestResponse> {
    return this.http.post<CandidateWatchRequestResponse>(`${this.base}/watchlist/requests`, payload);
  }

  getMyWatchRequests(): Observable<CandidateWatchRequestResponse[]> {
    return this.http.get<CandidateWatchRequestResponse[]>(`${this.base}/watchlist/requests`);
  }

  getMyWatchlist(): Observable<RecruiterWatchlistEntryResponse[]> {
    return this.http.get<RecruiterWatchlistEntryResponse[]>(`${this.base}/watchlist`);
  }

  getWatchProgress(candidateAlias: string): Observable<RecruiterWatchProgressResponse> {
    return this.http.get<RecruiterWatchProgressResponse>(`${this.base}/watchlist/${candidateAlias}/progress`);
  }
}
