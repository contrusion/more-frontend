import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GmailAuthUrlResponse {
  authUrl: string;
}

export interface GmailStatusResponse {
  connected: boolean;
  provider?: string;
  email?: string;
  tokenExpiry?: string;
  lastSyncAt?: string;
  lastSyncSuccess?: boolean;
  lastSyncProcessedCount?: number;
}

export interface EmailSyncResult {
  userId: string;
  syncedAt: string;
  totalFetched: number;
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
  durationMs: number;
  success: boolean;
}

export interface SyncStatusResponse {
  syncing: boolean;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailSyncService {
  private readonly apiUrl = `${environment.apiUrl}/api/email`;

  constructor(private http: HttpClient) {}

  /**
   * Get Gmail OAuth authorization URL
   */
  getGmailAuthUrl(): Observable<GmailAuthUrlResponse> {
    return this.http.get<GmailAuthUrlResponse>(`${this.apiUrl}/gmail/auth-url`);
  }

  /**
   * Check Gmail connection status
   */
  getGmailStatus(): Observable<GmailStatusResponse> {
    return this.http.get<GmailStatusResponse>(`${this.apiUrl}/gmail/status`);
  }

  /**
   * Revoke Gmail access
   */
  revokeGmailAccess(): Observable<{message: string, status: string}> {
    console.log('Calling DELETE /api/email/gmail/revoke');
    return this.http.delete<{message: string, status: string}>(`${this.apiUrl}/gmail/revoke`);
  }

  /**
   * Trigger manual email sync
   * Fetches and imports LinkedIn recruiter emails from Gmail
   */
  syncNow(): Observable<EmailSyncResult> {
    return this.http.post<EmailSyncResult>(`${this.apiUrl}/sync`, {});
  }

  /**
   * Check if email sync is currently in progress
   */
  getSyncStatus(): Observable<SyncStatusResponse> {
    return this.http.get<SyncStatusResponse>(`${this.apiUrl}/sync-status`);
  }

  /**
   * Open Gmail OAuth authorization in a popup window
   */
  openOAuthPopup(authUrl: string): Window | null {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    return window.open(
      authUrl,
      'Gmail Authorization',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
  }
}
