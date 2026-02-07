import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailSyncService, GmailStatusResponse } from '../services/email-sync.service';

@Component({
  selector: 'app-email-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-sync.component.html',
  styleUrls: ['./email-sync.component.css']
})
export class EmailSyncComponent implements OnInit {
  loading = false;
  gmailStatus: GmailStatusResponse | null = null;
  error: string | null = null;
  success: string | null = null;
  oauthWindow: Window | null = null;

  constructor(
    private emailSyncService: EmailSyncService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for OAuth callback status
    this.route.queryParams.subscribe(params => {
      if (params['status'] === 'success') {
        // If we're in a popup window (OAuth callback), close it
        if (window.opener) {
          console.log('OAuth success - closing popup window');
          window.close();
          return;
        }
        
        // Otherwise, show success message in main window
        this.success = 'Gmail connected successfully!';
        this.checkGmailStatus();
        // Clean up URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      } else if (params['status'] === 'error') {
        // If we're in a popup window, close it
        if (window.opener) {
          console.log('OAuth error - closing popup window');
          window.close();
          return;
        }
        
        // Otherwise, show error in main window
        this.error = params['message'] || 'Failed to connect Gmail';
      }
    });

    // Initial status check (only if not in popup)
    if (!window.opener) {
      this.checkGmailStatus();
    }
  }

  checkGmailStatus(): void {
    this.loading = true;
    this.error = null;

    this.emailSyncService.getGmailStatus().subscribe({
      next: (status) => {
        this.gmailStatus = status;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to check Gmail status:', err);
        this.error = 'Failed to check Gmail connection status';
        this.loading = false;
      }
    });
  }

  connectGmail(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    this.emailSyncService.getGmailAuthUrl().subscribe({
      next: (response) => {
        this.loading = false;
        // Open OAuth in popup
        this.oauthWindow = this.emailSyncService.openOAuthPopup(response.authUrl);
        
        // Monitor popup for closure
        const checkWindow = setInterval(() => {
          if (this.oauthWindow?.closed) {
            clearInterval(checkWindow);
            console.log('OAuth popup closed - refreshing status');
            // Refresh status after popup closes
            setTimeout(() => {
              this.checkGmailStatus();
              // Check if connection succeeded
              this.emailSyncService.getGmailStatus().subscribe({
                next: (status) => {
                  if (status.connected) {
                    this.success = 'Gmail connected successfully!';
                  }
                },
                error: (err) => {
                  console.error('Failed to verify connection:', err);
                }
              });
            }, 500);
          }
        }, 500);
      },
      error: (err) => {
        console.error('Failed to get auth URL:', err);
        this.error = err.error?.message || 'Failed to start Gmail authorization';
        this.loading = false;
      }
    });
  }

  disconnectGmail(): void {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.emailSyncService.revokeGmailAccess().subscribe({
      next: () => {
        this.success = 'Gmail disconnected successfully';
        this.gmailStatus = null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to disconnect Gmail:', err);
        this.error = 'Failed to disconnect Gmail';
        this.loading = false;
      }
    });
  }
}
