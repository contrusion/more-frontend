import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EmailScanStrategyType,
  EmailSyncService,
  EmailSyncResult,
  GmailStatusResponse,
  UserEmailSettings
} from '../services/email-sync.service';
import { InteractionService } from '../services/interaction.service';

@Component({
  selector: 'app-email-sync',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-sync.component.html',
  styleUrls: ['./email-sync.component.css']
})
export class EmailSyncComponent implements OnInit, OnDestroy {
  loading = false;
  gmailStatus: GmailStatusResponse | null = null;
  error: string | null = null;
  success: string | null = null;
  oauthWindow: Window | null = null;
  senderEmails: string[] = [];
  senderEmailInput = '';
  senderEmailInputError: string | null = null;
  
  // Sync state
  syncInProgress = false;
  syncPhase = 'Idle';
  syncOverallProgress = 0;
  fetchProgress = 0;
  processProgress = 0;
  syncFetched = 0;
  syncProcessed = 0;
  syncSkipped = 0;
  syncFailed = 0;
  lastSyncResult: EmailSyncResult | null = null;
  syncError: string | null = null;
  showDisconnectConfirmation = false;
  private syncStatusPollId: number | null = null;

  settingsForm: FormGroup;
  settingsLoading = false;
  settingsSaving = false;
  settingsError: string | null = null;
  settingsSuccess: string | null = null;
  readonly strategyOptions: { value: EmailScanStrategyType; label: string; }[] = [
    { value: 'THRESHOLD_MAILBOX', label: 'Threshold Mailbox Scan' },
    { value: 'LABELLED_EMAILS', label: 'Labelled Emails (Pending)' },
    { value: 'SPECIFIC_EMAIL_ADDRESS', label: 'Specific Sender Addresses' },
    { value: 'EMAIL_DOMAIN', label: 'Email Domain' }
  ];

  constructor(
    private emailSyncService: EmailSyncService,
    private interactionService: InteractionService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      historicalDataLimitDays: [180, [Validators.required, Validators.min(1), Validators.max(3650)]],
      scanStrategyType: ['THRESHOLD_MAILBOX' as EmailScanStrategyType, Validators.required],
      scanLabelName: [''],
      scanSenderEmail: ['', [this.senderEmailListValidator.bind(this)]],
      scanSenderDomain: ['']
    });
  }

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
      this.loadSettings();
    }

    this.settingsForm.get('scanStrategyType')?.valueChanges.subscribe(() => {
      this.settingsForm.get('scanSenderEmail')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    this.stopSyncStatusPolling();
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
    this.syncPhase = 'Starting sync';
    this.syncOverallProgress = 0;
    this.fetchProgress = 0;
    this.processProgress = 0;
    this.syncFetched = 0;
    this.syncProcessed = 0;
    this.syncSkipped = 0;
    this.syncFailed = 0;
    this.syncError = null;
    this.error = null;
    this.success = null;

    this.startSyncStatusPolling();

    console.log('Starting email sync...');

    this.emailSyncService.syncNow().subscribe({
      next: (result) => {
        this.stopSyncStatusPolling();
        this.lastSyncResult = result;
        this.syncInProgress = false;
        this.syncPhase = 'Completed';
        this.syncOverallProgress = 100;
        this.fetchProgress = 100;
        this.processProgress = 100;
        this.syncFetched = result.totalFetched;
        this.syncProcessed = result.processed;
        this.syncSkipped = result.skipped;
        this.syncFailed = result.failed;
        
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
        this.stopSyncStatusPolling();
        this.syncInProgress = false;
        
        if (err.status === 409) {
          this.syncError = 'Sync already in progress';
        } else {
          this.syncError = err.error?.message || 'Failed to sync emails';
        }
      }
    });
  }

  private startSyncStatusPolling(): void {
    this.stopSyncStatusPolling();
    this.refreshSyncStatus();
    this.syncStatusPollId = window.setInterval(() => this.refreshSyncStatus(), 1000);
  }

  private stopSyncStatusPolling(): void {
    if (this.syncStatusPollId !== null) {
      window.clearInterval(this.syncStatusPollId);
      this.syncStatusPollId = null;
    }
  }

  private refreshSyncStatus(): void {
    this.emailSyncService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncInProgress = status.syncing;
        this.syncPhase = this.formatSyncPhase(status.phase, status.syncing);
        this.syncOverallProgress = typeof status.progressPercent === 'number'
          ? status.progressPercent
          : this.syncOverallProgress;
        this.fetchProgress = this.resolveFetchProgress(status);
        this.processProgress = this.resolveProcessProgress(status);
        this.syncFetched = status.totalFetched ?? this.syncFetched;
        this.syncProcessed = status.processed ?? this.syncProcessed;
        this.syncSkipped = status.skipped ?? this.syncSkipped;
        this.syncFailed = status.failed ?? this.syncFailed;
      },
      error: (err) => {
        console.error('Failed to refresh sync status:', err);
      }
    });
  }

  private resolveFetchProgress(status: { phase?: string; fetchProgressPercent?: number; syncing: boolean; }): number {
    if (typeof status.fetchProgressPercent === 'number') {
      return status.fetchProgressPercent;
    }

    if (status.phase === 'FETCHING_EMAILS') {
      return status.syncing ? 60 : 100;
    }

    if (status.phase === 'PROCESSING_EMAILS' || status.phase === 'COMPLETED') {
      return 100;
    }

    return this.fetchProgress;
  }

  private resolveProcessProgress(status: { phase?: string; processProgressPercent?: number; syncing: boolean; }): number {
    if (typeof status.processProgressPercent === 'number') {
      return status.processProgressPercent;
    }

    if (status.phase === 'PROCESSING_EMAILS') {
      return status.syncing ? Math.max(this.processProgress, 5) : 100;
    }

    if (status.phase === 'COMPLETED') {
      return 100;
    }

    return this.processProgress;
  }

  private formatSyncPhase(phase?: string, syncing?: boolean): string {
    switch (phase) {
      case 'FETCHING_EMAILS':
        return 'Fetching emails';
      case 'PROCESSING_EMAILS':
        return 'Processing emails';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return syncing ? 'Syncing emails' : 'Idle';
    }
  }

  loadSettings(): void {
    this.settingsLoading = true;
    this.settingsError = null;

    this.emailSyncService.getSettings().subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.settingsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load email settings:', err);
        this.settingsError = 'Failed to load scan settings';
        this.settingsLoading = false;
      }
    });
  }

  saveSettings(): void {
    if (!this.commitSenderEmailInput()) {
      return;
    }

    if (this.settingsForm.invalid || this.settingsSaving) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.settingsSaving = true;
    this.settingsError = null;
    this.settingsSuccess = null;

    const selectedStrategy = this.settingsForm.value.scanStrategyType as EmailScanStrategyType;
    const payload: UserEmailSettings = {
      historicalDataLimitDays: Number(this.settingsForm.value.historicalDataLimitDays),
      scanStrategyType: selectedStrategy,
      scanLabelName: selectedStrategy === 'LABELLED_EMAILS'
        ? this.normalizeOptionalField(this.settingsForm.value.scanLabelName)
        : null,
      scanSenderEmail: selectedStrategy === 'SPECIFIC_EMAIL_ADDRESS'
        ? this.normalizeSenderEmailList(this.senderEmails.join('\n'))
        : null,
      scanSenderDomain: selectedStrategy === 'EMAIL_DOMAIN'
        ? this.normalizeOptionalField(this.settingsForm.value.scanSenderDomain)
        : null
    };

    this.emailSyncService.updateSettings(payload).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.settingsSaving = false;
        this.settingsSuccess = 'Scan settings saved';
      },
      error: (err) => {
        console.error('Failed to save email settings:', err);
        this.settingsError = err.error?.message || 'Failed to save scan settings';
        this.settingsSaving = false;
      }
    });
  }

  isStrategyPending(): boolean {
    const strategy = this.settingsForm.value.scanStrategyType as EmailScanStrategyType;
    return strategy === 'LABELLED_EMAILS' || strategy === 'EMAIL_DOMAIN';
  }

  isSpecificEmailStrategy(): boolean {
    return this.settingsForm?.get('scanStrategyType')?.value === 'SPECIFIC_EMAIL_ADDRESS';
  }

  private applySettings(settings: UserEmailSettings): void {
    this.senderEmails = this.parseSenderEmails(settings.scanSenderEmail);
    this.senderEmailInput = '';
    this.senderEmailInputError = null;

    this.settingsForm.patchValue({
      historicalDataLimitDays: settings.historicalDataLimitDays ?? 180,
      scanStrategyType: settings.scanStrategyType ?? 'THRESHOLD_MAILBOX',
      scanLabelName: settings.scanLabelName ?? '',
      scanSenderEmail: this.senderEmails.join('\n'),
      scanSenderDomain: settings.scanSenderDomain ?? ''
    });

    this.syncSenderEmailControl();
  }

  private normalizeOptionalField(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeSenderEmailList(value: string | null | undefined): string | null {
    const entries = (value ?? '')
      .split(/[\s,;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry, index, all) => entry.length > 0 && all.indexOf(entry) === index);

    return entries.length > 0 ? entries.join('\n') : null;
  }

  addSenderEmailInput(): void {
    if (!this.commitSenderEmailInput()) {
      return;
    }
  }

  removeSenderEmail(index: number): void {
    this.senderEmails.splice(index, 1);
    this.senderEmailInputError = null;
    this.syncSenderEmailControl();
  }

  onSenderEmailKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      this.addSenderEmailInput();
    }
  }

  onSenderEmailPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    if (!pastedText) {
      return;
    }

    const parsedEmails = this.parseSenderEmails(pastedText);
    if (parsedEmails.length > 0) {
      event.preventDefault();
      this.appendSenderEmails(parsedEmails);
      this.senderEmailInput = '';
      this.senderEmailInputError = null;
    }
  }

  private senderEmailListValidator(_control: AbstractControl): ValidationErrors | null {
    if (!this.isSpecificEmailStrategy()) {
      return null;
    }

    if (this.senderEmails.length === 0) {
      return { requiredForStrategy: true };
    }

    return null;
  }

  private commitSenderEmailInput(): boolean {
    const rawValue = this.senderEmailInput.trim();
    if (!rawValue) {
      this.senderEmailInputError = null;
      return true;
    }

    const parsedEmails = this.parseSenderEmails(rawValue);
    if (parsedEmails.length === 0) {
      this.senderEmailInputError = 'Enter at least one valid sender email address.';
      return false;
    }

    const invalidEntries = this.extractSenderEmailParts(rawValue)
      .filter((entry) => !this.isValidEmail(entry));

    if (invalidEntries.length > 0) {
      this.senderEmailInputError = invalidEntries.length === 1
        ? `${invalidEntries[0]} is not a valid email address.`
        : 'One or more sender email addresses are invalid.';
      return false;
    }

    this.appendSenderEmails(parsedEmails);
    this.senderEmailInput = '';
    this.senderEmailInputError = null;
    return true;
  }

  private appendSenderEmails(emails: string[]): void {
    const normalizedExisting = new Set(this.senderEmails.map((entry) => entry.toLowerCase()));

    for (const email of emails) {
      const normalized = email.toLowerCase();
      if (!normalizedExisting.has(normalized)) {
        normalizedExisting.add(normalized);
        this.senderEmails.push(normalized);
      }
    }

    this.syncSenderEmailControl();
  }

  private parseSenderEmails(value: string | null | undefined): string[] {
    return this.extractSenderEmailParts(value)
      .map((entry) => entry.toLowerCase())
      .filter((entry, index, all) => all.indexOf(entry) === index)
      .filter((entry) => this.isValidEmail(entry));
  }

  private extractSenderEmailParts(value: string | null | undefined): string[] {
    return (value ?? '')
      .split(/[\s,;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private syncSenderEmailControl(): void {
    const control = this.settingsForm.get('scanSenderEmail');
    if (!control) {
      return;
    }

    control.setValue(this.senderEmails.join('\n'), { emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }
}
