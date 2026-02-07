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
  revokeGmailAccess(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/gmail/revoke`);
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
