import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CandidateChallengeView, ChallengeProofSubmissionRequest } from './challenge.model';

@Injectable({ providedIn: 'root' })
export class CandidateChallengeService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAvailableChallenges(): Observable<CandidateChallengeView[]> {
    return this.http.get<CandidateChallengeView[]>(`${this.base}/api/challenges`);
  }

  getMyEnrolments(): Observable<CandidateChallengeView[]> {
    return this.http.get<CandidateChallengeView[]>(`${this.base}/api/candidates/me/challenges`);
  }

  enrol(challengeId: string): Observable<CandidateChallengeView> {
    return this.http.post<CandidateChallengeView>(
      `${this.base}/api/candidates/me/challenges/${challengeId}/enrol`,
      {}
    );
  }

  submitProof(challengeId: string, request: ChallengeProofSubmissionRequest): Observable<CandidateChallengeView> {
    return this.http.post<CandidateChallengeView>(
      `${this.base}/api/candidates/me/challenges/${challengeId}/proof`,
      request
    );
  }
}
