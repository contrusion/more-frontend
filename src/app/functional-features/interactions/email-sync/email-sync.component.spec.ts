import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailSyncComponent } from './email-sync.component';
import { EmailSyncService } from '../services/email-sync.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('EmailSyncComponent', () => {
  let component: EmailSyncComponent;
  let fixture: ComponentFixture<EmailSyncComponent>;
  let emailSyncService: jasmine.SpyObj<EmailSyncService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const emailSyncServiceSpy = jasmine.createSpyObj('EmailSyncService', [
      'getGmailStatus',
      'getGmailAuthUrl',
      'revokeGmailAccess',
      'openOAuthPopup'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    activatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [EmailSyncComponent],
      providers: [
        { provide: EmailSyncService, useValue: emailSyncServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    emailSyncService = TestBed.inject(EmailSyncService) as jasmine.SpyObj<EmailSyncService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(EmailSyncComponent);
    component = fixture.componentInstance;
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
    spyOn(window, 'confirm').and.returnValue(true);
    emailSyncService.revokeGmailAccess.and.returnValue(of(void 0));
    
    component.disconnectGmail();
    
    expect(emailSyncService.revokeGmailAccess).toHaveBeenCalled();
    expect(component.gmailStatus).toBeNull();
  });

  it('should handle errors when connecting Gmail', () => {
    const error = { error: { message: 'Connection failed' } };
    emailSyncService.getGmailAuthUrl.and.returnValue(throwError(() => error));
    
    component.connectGmail();
    
    expect(component.error).toBe('Connection failed');
    expect(component.loading).toBeFalse();
  });
});
