import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailSyncComponent } from './email-sync.component';
import { EmailSyncService } from '../services/email-sync.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InteractionService } from '../services/interaction.service';

describe('EmailSyncComponent', () => {
  let component: EmailSyncComponent;
  let fixture: ComponentFixture<EmailSyncComponent>;
  let emailSyncService: jasmine.SpyObj<EmailSyncService>;
  let interactionService: jasmine.SpyObj<InteractionService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const emailSyncServiceSpy = jasmine.createSpyObj('EmailSyncService', [
      'getGmailStatus',
      'getGmailAuthUrl',
      'revokeGmailAccess',
      'openOAuthPopup',
      'syncNow',
      'getSyncStatus',
      'getSettings',
      'updateSettings'
    ]);
    const interactionServiceSpy = jasmine.createSpyObj('InteractionService', ['getThreads']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    activatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [EmailSyncComponent],
      providers: [
        { provide: EmailSyncService, useValue: emailSyncServiceSpy },
        { provide: InteractionService, useValue: interactionServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    emailSyncService = TestBed.inject(EmailSyncService) as jasmine.SpyObj<EmailSyncService>;
    interactionService = TestBed.inject(InteractionService) as jasmine.SpyObj<InteractionService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(EmailSyncComponent);
    component = fixture.componentInstance;

    emailSyncService.getGmailStatus.and.returnValue(of({ connected: false }));
    emailSyncService.getSyncStatus.and.returnValue(of({ syncing: false, userId: 'user-1', progressPercent: 0 }));
    emailSyncService.getSettings.and.returnValue(of({
      historicalDataLimitDays: 180,
      scanStrategyType: 'THRESHOLD_MAILBOX'
    }));
    interactionService.getThreads.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check Gmail status on init', () => {
    emailSyncService.getGmailStatus.and.returnValue(of({ connected: false }));
    
    fixture.detectChanges();
    
    expect(emailSyncService.getGmailStatus).toHaveBeenCalled();
  });

  it('should connect Gmail successfully', () => {
    const authUrl = 'https://accounts.google.com/o/oauth2/auth?...';
    emailSyncService.getGmailAuthUrl.and.returnValue(of({ authUrl }));
    emailSyncService.openOAuthPopup.and.returnValue(window.open('', '_blank'));
    
    component.connectGmail();
    
    expect(emailSyncService.getGmailAuthUrl).toHaveBeenCalled();
    expect(emailSyncService.openOAuthPopup).toHaveBeenCalledWith(authUrl);
  });

  it('should disconnect Gmail successfully', () => {
    emailSyncService.revokeGmailAccess.and.returnValue(of({ message: 'ok', status: 'success' }));

    component.disconnectGmail();

    expect(component.showDisconnectConfirmation).toBeTrue();

    component.confirmDisconnect();

    expect(emailSyncService.revokeGmailAccess).toHaveBeenCalled();
    expect(component.gmailStatus).toBeNull();
  });

  it('should save scan settings successfully', () => {
    emailSyncService.updateSettings.and.returnValue(of({
      historicalDataLimitDays: 60,
      scanStrategyType: 'SPECIFIC_EMAIL_ADDRESS',
      scanSenderEmail: 'aneneb@x-idian.com\nsteven@aesglobal.io'
    }));

    component.settingsForm.patchValue({
      historicalDataLimitDays: 60,
      scanStrategyType: 'SPECIFIC_EMAIL_ADDRESS',
      scanSenderEmail: ''
    });
    component.senderEmailInput = 'aneneb@x-idian.com, steven@aesglobal.io';
    component.addSenderEmailInput();

    component.saveSettings();

    expect(emailSyncService.updateSettings).toHaveBeenCalledWith(jasmine.objectContaining({
      historicalDataLimitDays: 60,
      scanStrategyType: 'SPECIFIC_EMAIL_ADDRESS',
      scanSenderEmail: 'aneneb@x-idian.com\nsteven@aesglobal.io'
    }));
    expect(component.settingsSuccess).toBe('Scan settings saved');
  });

  it('should require sender emails for specific-email strategy', () => {
    component.settingsForm.patchValue({
      scanStrategyType: 'SPECIFIC_EMAIL_ADDRESS',
      scanSenderEmail: ''
    });
    component.senderEmails = [];
    component['syncSenderEmailControl']();

    component.saveSettings();

    expect(emailSyncService.updateSettings).not.toHaveBeenCalled();
    expect(component.settingsForm.get('scanSenderEmail')?.hasError('requiredForStrategy')).toBeTrue();
  });

  it('should add sender emails from pasted text and remove duplicates', () => {
    component.senderEmailInput = 'ANENEB@x-idian.com, steven@aesglobal.io; aneneb@x-idian.com';

    component.addSenderEmailInput();

    expect(component.senderEmails).toEqual(['aneneb@x-idian.com', 'steven@aesglobal.io']);
    expect(component.senderEmailInput).toBe('');
    expect(component.settingsForm.get('scanSenderEmail')?.value).toBe('aneneb@x-idian.com\nsteven@aesglobal.io');
  });

  it('should remove a sender email chip', () => {
    component.senderEmails = ['aneneb@x-idian.com', 'steven@aesglobal.io'];
    component['syncSenderEmailControl']();

    component.removeSenderEmail(0);

    expect(component.senderEmails).toEqual(['steven@aesglobal.io']);
    expect(component.settingsForm.get('scanSenderEmail')?.value).toBe('steven@aesglobal.io');
  });

  it('should handle errors when connecting Gmail', () => {
    const error = { error: { message: 'Connection failed' } };
    emailSyncService.getGmailAuthUrl.and.returnValue(throwError(() => error));
    
    component.connectGmail();
    
    expect(component.error).toBe('Connection failed');
    expect(component.loading).toBeFalse();
  });

  it('should update progress while syncing emails', () => {
    emailSyncService.syncNow.and.returnValue(of({
      userId: 'user-1',
      syncedAt: new Date().toISOString(),
      totalFetched: 10,
      processed: 7,
      skipped: 2,
      failed: 1,
      errors: [],
      durationMs: 1200,
      success: true
    }));
    emailSyncService.getSyncStatus.and.returnValue(of({
      syncing: true,
      userId: 'user-1',
      phase: 'PROCESSING_EMAILS',
      progressPercent: 55,
      fetchProgressPercent: 100,
      processProgressPercent: 55,
      totalFetched: 10,
      processed: 5,
      skipped: 0,
      failed: 0
    }));

    component.syncEmails();

    expect(emailSyncService.getSyncStatus).toHaveBeenCalled();
    expect(component.syncOverallProgress).toBe(100);
    expect(component.fetchProgress).toBe(100);
    expect(component.processProgress).toBe(100);
    expect(component.syncPhase).toBe('Completed');
    expect(component.syncFetched).toBe(10);
    expect(component.syncProcessed).toBe(7);
    expect(component.lastSyncResult?.success).toBeTrue();
  });
});
