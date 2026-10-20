import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MlEventLabel,
  MlEventLabelRequest,
  MlLabelGroup,
  MlLabelGroupRequest,
  MlPromptDraft,
  MlPromptItem,
  MlPromptItemRequest,
  MlPromptPreview,
  MlPromptSection,
  MlPromptSectionType,
  MlPromptSectionUpdateRequest,
  MlPromptStatus,
  MlPromptVersion,
  MlUnknownClassification,
  MlUnknownPage,
  MlUnknownStatus,
  MlUnknownSummary
} from './ml-prompt.model';

@Injectable({ providedIn: 'root' })
export class MlPromptService {
  private readonly http = inject(HttpClient);
  private readonly promptUrl = `${environment.apiUrl}/api/v1/admin/ml/prompt`;
  private readonly unknownUrl = `${environment.apiUrl}/api/v1/admin/ml/unknown-classifications`;

  /** Messages waiting for an admin review; kept current by getUnknownSummary(). */
  readonly unreviewedCount = signal(0);

  getDraft(): Observable<MlPromptDraft> {
    return this.http.get<MlPromptDraft>(`${this.promptUrl}/draft`);
  }

  getStatus(): Observable<MlPromptStatus> {
    return this.http.get<MlPromptStatus>(`${this.promptUrl}/status`);
  }

  getPreview(): Observable<MlPromptPreview> {
    return this.http.get<MlPromptPreview>(`${this.promptUrl}/preview`);
  }

  updateSection(type: MlPromptSectionType, request: MlPromptSectionUpdateRequest): Observable<MlPromptSection> {
    return this.http.put<MlPromptSection>(`${this.promptUrl}/sections/${type}`, request);
  }

  addItem(type: MlPromptSectionType, request: MlPromptItemRequest): Observable<MlPromptItem> {
    return this.http.post<MlPromptItem>(`${this.promptUrl}/sections/${type}/items`, request);
  }

  updateItem(id: string, request: MlPromptItemRequest): Observable<MlPromptItem> {
    return this.http.put<MlPromptItem>(`${this.promptUrl}/items/${id}`, request);
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.promptUrl}/items/${id}`);
  }

  reorderItems(type: MlPromptSectionType, ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.promptUrl}/sections/${type}/items/order`, { ids });
  }

  createGroup(request: MlLabelGroupRequest): Observable<MlLabelGroup> {
    return this.http.post<MlLabelGroup>(`${this.promptUrl}/groups`, request);
  }

  updateGroup(id: string, request: MlLabelGroupRequest): Observable<MlLabelGroup> {
    return this.http.put<MlLabelGroup>(`${this.promptUrl}/groups/${id}`, request);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.promptUrl}/groups/${id}`);
  }

  reorderGroups(ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.promptUrl}/groups/order`, { ids });
  }

  reorderLabelsInGroup(groupId: string, ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.promptUrl}/groups/${groupId}/labels/order`, { ids });
  }

  createLabel(request: MlEventLabelRequest): Observable<MlEventLabel> {
    return this.http.post<MlEventLabel>(`${this.promptUrl}/labels`, request);
  }

  updateLabel(id: string, request: MlEventLabelRequest): Observable<MlEventLabel> {
    return this.http.put<MlEventLabel>(`${this.promptUrl}/labels/${id}`, request);
  }

  deleteLabel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.promptUrl}/labels/${id}`);
  }

  reorderHierarchy(ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.promptUrl}/labels/hierarchy`, { ids });
  }

  publish(note: string | null): Observable<MlPromptVersion> {
    return this.http.post<MlPromptVersion>(`${this.promptUrl}/publish`, { note });
  }

  getVersions(): Observable<MlPromptVersion[]> {
    return this.http.get<MlPromptVersion[]>(`${this.promptUrl}/versions`);
  }

  getVersion(versionNumber: number): Observable<MlPromptVersion> {
    return this.http.get<MlPromptVersion>(`${this.promptUrl}/versions/${versionNumber}`);
  }

  restoreToDraft(versionNumber: number): Observable<void> {
    return this.http.post<void>(`${this.promptUrl}/versions/${versionNumber}/restore-to-draft`, {});
  }

  getUnknownClassifications(status: MlUnknownStatus | null, page = 0, size = 20): Observable<MlUnknownPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<MlUnknownPage>(this.unknownUrl, { params });
  }

  getUnknownSummary(): Observable<MlUnknownSummary> {
    return this.http.get<MlUnknownSummary>(`${this.unknownUrl}/summary`)
      .pipe(tap(summary => this.unreviewedCount.set(summary.unreviewedCount)));
  }

  updateUnknownStatus(id: string, status: MlUnknownStatus): Observable<MlUnknownClassification> {
    return this.http.patch<MlUnknownClassification>(`${this.unknownUrl}/${id}/status`, { status });
  }
}
