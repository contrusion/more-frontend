import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DatasetExportRequest {
  sinceDays?: number;
  maxResults?: number;
  includeSent?: boolean;
  includeInbox?: boolean;
  searchQuery?: string;
}

export interface RecruitmentEmailDto {
  emailId: string;
  subject: string;
  bodyText: string;
  fromEmail: string;
  fromName: string;
  receivedDate: string;
  snippet: string;
  folder: string;
  label?: string;
  companyName?: string;
  recruiterName?: string;
  hasAttachments: boolean;
}

export interface ExportStats {
  inboxCount: number;
  sentCount: number;
  withAttachments: number;
  avgBodyLength: number;
  oldestEmail: string;
  newestEmail: string;
}

export interface DatasetExportResponse {
  userId: string;
  exportedAt: string;
  totalEmails: number;
  emails: RecruitmentEmailDto[];
  errors: string[];
  success: boolean;
  stats: ExportStats;
}

@Injectable({
  providedIn: 'root'
})
export class RecruitmentDatasetService {
  private readonly apiUrl = `${environment.apiUrl}/api/email/dataset`;

  constructor(private http: HttpClient) {}

  /**
   * Export recruitment emails for ML dataset (JSON format)
   */
  exportDataset(request?: DatasetExportRequest): Observable<DatasetExportResponse> {
    return this.http.post<DatasetExportResponse>(`${this.apiUrl}/export`, request || {});
  }

  /**
   * Export recruitment emails as CSV for labeling
   */
  exportDatasetCsv(request?: DatasetExportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export/csv`, request || {}, {
      responseType: 'blob'
    });
  }

  /**
   * Preview first 10 recruitment emails
   */
  previewDataset(sinceDays: number = 30): Observable<DatasetExportResponse> {
    return this.http.get<DatasetExportResponse>(`${this.apiUrl}/preview`, {
      params: { sinceDays: sinceDays.toString() }
    });
  }

  /**
   * Download CSV file to user's machine
   */
  downloadCsv(csvBlob: Blob, filename: string = 'recruitment_emails_dataset.csv'): void {
    const url = window.URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
