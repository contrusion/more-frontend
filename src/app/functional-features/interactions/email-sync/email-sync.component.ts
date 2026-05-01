import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailSyncService, GmailStatusResponse, EmailSyncResult } from '../services/email-sync.service';
import { InteractionService } from '../services/interaction.service';

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
  
  // Sync state
  syncInProgress = false;
  lastSyncResult: EmailSyncResult | null = null;
  syncError: string | null = null;
  showDisconnectConfirmation = false;

  constructor(
    private emailSyncService: EmailSyncService,
    private interactionService: InteractionService,
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
    console.log('disconnectGmail() called');
    this.showDisconnectConfirmation = true;
  }

  cancelDisconnect(): void {
    console.log('User cancelled disconnect');
    this.showDisconnectConfirmation = false;
  }

  confirmDisconnect(): void {
    console.log('User confirmed disconnect, sending request...');
    this.showDisconnectConfirmation = false;
    this.loading = true;
    this.error = null;
    this.success = null;

    this.emailSyncService.revokeGmailAccess().subscribe({
      next: (response) => {
        console.log('Disconnect successful:', response);
        this.success = 'Gmail disconnected successfully';
        this.gmailStatus = null;
        this.lastSyncResult = null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to disconnect Gmail:', err);
        this.error = err.error?.message || 'Failed to disconnect Gmail';
        this.loading = false;
      }
    });
  }

  /**
   * Trigger manual email sync
   * Fetches and imports LinkedIn recruiter emails from Gmail
   */
  syncEmails(): void {
    if (this.syncInProgress) {
      return; // Already syncing
    }

    this.syncInProgress = true;
    this.syncError = null;
    this.error = null;
    this.success = null;

    console.log('Starting email sync...');

    this.emailSyncService.syncNow().subscribe({
      next: (result) => {
        this.lastSyncResult = result;
        this.syncInProgress = false;
        
        console.log('Sync completed:', result);

        if (result.success && result.processed > 0) {
          this.success = `✓ ${result.processed} new interaction${result.processed > 1 ? 's' : ''} imported`;
          
          // Refresh interactions list after successful sync
          this.interactionService.getThreads().subscribe({
            next: () => console.log('Interactions refreshed after sync'),
            error: (err) => console.error('Failed to refresh interactions:', err)
          });
        } else if (result.success && result.processed === 0) {
          this.success = 'No new interactions found';
        } else if (!result.success) {
          this.syncError = result.errors.join(', ') || 'Sync failed';
        }

        // Refresh Gmail status to get updated last sync info
        this.checkGmailStatus();

        // Show sync statistics if there were items fetched
        if (result.totalFetched > 0) {
          console.log(`Sync stats: ${result.totalFetched} fetched, ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`);
        }
      },
      error: (err) => {
        console.error('Email sync failed:', err);
        this.syncInProgress = false;
        
        if (err.status === 409) {
          this.syncError = 'Sync already in progress';
        } else {
          this.syncError = err.error?.message || 'Failed to sync emails';
        }
      }
    });
  }
}
