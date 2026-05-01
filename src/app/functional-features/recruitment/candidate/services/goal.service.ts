import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CandidateGoal, CreateGoalRequest, UpdateGoalRequest } from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly apiUrl = `${environment.apiUrl}/api/candidates/goals`;

  constructor(private http: HttpClient) {}

  getGoals(): Observable<CandidateGoal[]> {
    return this.http.get<CandidateGoal[]>(this.apiUrl);
  }

  createGoal(request: CreateGoalRequest): Observable<CandidateGoal> {
    return this.http.post<CandidateGoal>(this.apiUrl, request);
  }

  updateGoal(goalId: string, request: UpdateGoalRequest): Observable<CandidateGoal> {
    return this.http.patch<CandidateGoal>(`${this.apiUrl}/${goalId}`, request);
  }

  deleteGoal(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${goalId}`);
  }

  reopenGoal(goalId: string): Observable<CandidateGoal> {
    return this.http.patch<CandidateGoal>(`${this.apiUrl}/${goalId}/reopen`, {});
  }
}
