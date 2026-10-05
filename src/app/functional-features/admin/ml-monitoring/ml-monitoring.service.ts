import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MlPerformanceSummary {
  totalPredictions: number;
  reviewRequiredCount: number;
  reviewRate: number;
  averageConfidence: number;
  pendingReviewCount: number;
  acceptedReviewCount: number;
  rejectedReviewCount: number;
  eventTypeBreakdown: Record<string, number>;
}

export interface MlReviewQueueEntry {
  messageId: string;
  sourceProvider: string;
  eventType: string;
  additionalEventTypes?: string[];
  confidence: number;
  companyName: string | null;
  jobTitle: string | null;
  summary: string | null;
  createdAt: string;
  status: string;
}

export interface MlAuditEntry {
  messageId: string;
  sourceProvider: string;
  eventType: string;
  additionalEventTypes?: string[];
  confidence: number;
  reviewRequired: boolean;
  companyName: string | null;
  jobTitle: string | null;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class MlMonitoringService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/ml`;

  getPerformanceSummary(): Observable<MlPerformanceSummary> {
    return this.http.get<MlPerformanceSummary>(`${this.baseUrl}/performance`);
  }

  getPendingReviews(): Observable<MlReviewQueueEntry[]> {
    return this.http.get<MlReviewQueueEntry[]>(`${this.baseUrl}/reviews/pending`);
  }

  getRecentAuditEntries(limit: number = 20): Observable<MlAuditEntry[]> {
    return this.http.get<MlAuditEntry[]>(`${this.baseUrl}/audit/recent`, {
      params: { limit: limit.toString() }
    });
  }

  resolveReviewDecision(messageId: string, accepted: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/reviews/${messageId}/decision`, {
      accepted
    });
  }
}
