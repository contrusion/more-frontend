import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateMilestoneRequest,
  CreateProofItemRequest,
  GoalMilestone,
  MilestoneProofItem,
  UpdateMilestoneRequest
} from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class MilestoneService {
  private readonly baseUrl = `${environment.apiUrl}/api/candidates/goals`;

  constructor(private http: HttpClient) {}

  getMilestones(goalId: string): Observable<GoalMilestone[]> {
    return this.http.get<GoalMilestone[]>(`${this.baseUrl}/${goalId}/milestones`);
  }

  createMilestone(goalId: string, request: CreateMilestoneRequest): Observable<GoalMilestone> {
    return this.http.post<GoalMilestone>(`${this.baseUrl}/${goalId}/milestones`, request);
  }

  addProof(goalId: string, milestoneId: string, request: CreateProofItemRequest): Observable<MilestoneProofItem> {
    return this.http.post<MilestoneProofItem>(
      `${this.baseUrl}/${goalId}/milestones/${milestoneId}/proof`,
      request
    );
  }

  updateMilestone(goalId: string, milestoneId: string, request: UpdateMilestoneRequest): Observable<GoalMilestone> {
    return this.http.put<GoalMilestone>(`${this.baseUrl}/${goalId}/milestones/${milestoneId}`, request);
  }

  deleteMilestone(goalId: string, milestoneId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${goalId}/milestones/${milestoneId}`);
  }
}
