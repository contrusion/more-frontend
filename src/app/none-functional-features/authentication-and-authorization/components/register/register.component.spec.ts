import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, CommonModule, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.registerForm.value).toEqual({
        email: '',
        firstName: '',
        lastName: '',
        userType: 'APPLICANT',
        jobTitle: '',
        companyWebsite: '',
        bio: '',
        password: '',
        confirmPassword: ''
      });
    });

    it('should have form invalid when empty', () => {
      expect(component.registerForm.valid).toBe(false);
    });

    it('should initialize isSubmitting as false', () => {
      expect(component.isSubmitting).toBe(false);
    });

    it('should initialize errorMessage as null', () => {
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should require email', () => {
      const email = component.registerForm.get('email');
      expect(email?.valid).toBe(false);
      expect(email?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const email = component.registerForm.get('email');
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);
      
      email?.setValue('valid@email.com');
      expect(email?.hasError('email')).toBe(false);
    });

    it('should require first name', () => {
      const firstName = component.registerForm.get('firstName');
      expect(firstName?.hasError('required')).toBe(true);
    });

    it('should require last name', () => {
      const lastName = component.registerForm.get('lastName');
      expect(lastName?.hasError('required')).toBe(true);
    });

    it('should require user type', () => {
      const userType = component.registerForm.get('userType');
      expect(userType?.hasError('required')).toBe(true);
    });

    it('should accept valid user types', () => {
      const userType = component.registerForm.get('userType');
      
      userType?.setValue('APPLICANT');
      expect(userType?.valid).toBe(true);
      
      userType?.setValue('RECRUITER');
      expect(userType?.valid).toBe(true);
    });

    it('should require job title', () => {
      const jobTitle = component.registerForm.get('jobTitle');
      expect(jobTitle?.hasError('required')).toBe(true);
    });

    it('should not require company website', () => {
      const companyWebsite = component.registerForm.get('companyWebsite');
      expect(companyWebsite?.hasError('required')).toBe(false);
    });

    it('should require company website when user type is RECRUITER', () => {
      component.registerForm.patchValue({ userType: 'RECRUITER' });
      const companyWebsite = component.registerForm.get('companyWebsite');
      expect(companyWebsite?.hasError('required')).toBe(true);
    });

    it('should not require company website when user type is APPLICANT', () => {
      component.registerForm.patchValue({ userType: 'APPLICANT' });
      const companyWebsite = component.registerForm.get('companyWebsite');
      expect(companyWebsite?.hasError('required')).toBe(false);
    });

    it('should require bio', () => {
      const bio = component.registerForm.get('bio');
      expect(bio?.hasError('required')).toBe(true);
    });

    it('should enforce minimum bio length', () => {
      const bio = component.registerForm.get('bio');
      bio?.setValue('Short bio');
      expect(bio?.hasError('minlength')).toBe(true);
      
      bio?.setValue('This is a longer bio with at least twenty characters');
      expect(bio?.hasError('minlength')).toBe(false);
    });

    it('should require password', () => {
      const password = component.registerForm.get('password');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should enforce minimum password length', () => {
      const password = component.registerForm.get('password');
      password?.setValue('short');
      expect(password?.hasError('minlength')).toBe(true);
      
      password?.setValue('longenough');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should require password confirmation', () => {
      const confirmPassword = component.registerForm.get('confirmPassword');
      expect(confirmPassword?.hasError('required')).toBe(true);
    });

    it('should validate password match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password456'
      });
      expect(component.registerForm.hasError('passwordsMismatch')).toBe(true);
      
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });
      expect(component.registerForm.hasError('passwordsMismatch')).toBe(false);
    });

    it('should have valid form when all fields are properly filled', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'RECRUITER',
        jobTitle: 'Software Developer',
        companyWebsite: 'https://www.example.com',
        bio: 'Experienced software developer with a passion for creating innovative solutions',
        password: 'password123',
        confirmPassword: 'password123'
      });
      expect(component.registerForm.valid).toBe(true);
    });

    it('should be invalid when RECRUITER is missing company website', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'RECRUITER',
        jobTitle: 'Software Developer',
        companyWebsite: '',
        bio: 'Experienced software developer with a passion for creating innovative solutions',
        password: 'password123',
        confirmPassword: 'password123'
      });
      expect(component.registerForm.valid).toBe(false);
    });
  });

  describe('Registration Functionality', () => {
    beforeEach(() => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'RECRUITER',
        jobTitle: 'Software Developer',
        companyWebsite: 'https://www.example.com',
        bio: 'Experienced software developer with a passion for creating innovative solutions',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });

    it('should not submit if form is invalid', () => {
      component.registerForm.patchValue({ email: '' });
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(false);
      httpMock.expectNone('http://localhost:8081/api/v1/accounts/register');
    });

    it('should set isSubmitting to true when submitting', () => {
      component.onSubmit();
      expect(component.isSubmitting).toBe(true);
    });

    it('should clear error message on submit', () => {
      component.errorMessage = 'Previous error';
      component.onSubmit();
      expect(component.errorMessage).toBeNull();
    });

    it('should send correct data to backend', () => {
      component.onSubmit();

      const req = httpMock.expectOne('http://localhost:8081/api/v1/accounts/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        enabled: true,
        userTypes: ['RECRUITER'],
        jobTitle: 'Software Developer',
        companyWebsite: 'https://www.example.com',
        bio: 'Experienced software developer with a passion for creating innovative solutions',
        credentials: [
          {
            type: 'password',
            value: 'password123',
            temporary: false
          }
        ]
      });
    });

    it('should send undefined for companyWebsite when empty', () => {
      component.registerForm.patchValue({ companyWebsite: '' });
      component.onSubmit();

      const req = httpMock.expectOne('http://localhost:8081/api/v1/accounts/register');
      expect(req.request.body.companyWebsite).toBeUndefined();
    });

    it('should navigate to login on successful registration', () => {
      component.onSubmit();

      const req = httpMock.expectOne('http://localhost:8081/api/v1/accounts/register');
      req.flush({ success: true });

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isSubmitting).toBe(false);
    });

    it('should display error message on registration failure', () => {
      component.onSubmit();

      const req = httpMock.expectOne('http://localhost:8081/api/v1/accounts/register');
      req.flush(
        { message: 'User already exists' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(component.errorMessage).toBe('User already exists');
      expect(component.isSubmitting).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should display default error message when none provided', () => {
      component.onSubmit();

      const req = httpMock.expectOne('http://localhost:8081/api/v1/accounts/register');
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(component.errorMessage).toBe('Registration failed. Please try again.');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login when goToLogin is called', () => {
      component.goToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to login when back button is clicked', () => {
      const backButton = fixture.debugElement.query(By.css('.back-button'));
      backButton.nativeElement.click();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Template Rendering', () => {
    it('should display title', () => {
      const title = fixture.debugElement.query(By.css('.register-title'));
      expect(title.nativeElement.textContent).toContain('Unlock Your Potential');
    });

    it('should display subtitle', () => {
      const subtitle = fixture.debugElement.query(By.css('.register-subtitle'));
      expect(subtitle.nativeElement.textContent).toContain('Join us today');
    });

    it('should display motivation banner', () => {
      const banner = fixture.debugElement.query(By.css('.motivation-banner'));
      expect(banner).toBeTruthy();
      expect(banner.nativeElement.textContent).toContain('Start your journey today');
    });

    it('should render all form fields', () => {
      expect(fixture.debugElement.query(By.css('#firstName'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#lastName'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#email'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#userType'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#jobTitle'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#bio'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#password'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#confirmPassword'))).toBeTruthy();
    });

    it('should have correct user type options', () => {
      const userTypeSelect = fixture.debugElement.query(By.css('#userType'));
      const options = userTypeSelect.nativeElement.querySelectorAll('option');
      
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('APPLICANT');
      expect(options[0].textContent).toContain('Job Seeker');
      expect(options[1].value).toBe('RECRUITER');
      expect(options[1].textContent).toContain('Recruiter');
    });

    it('should show company website field when user type is RECRUITER', () => {
      component.registerForm.patchValue({ userType: 'RECRUITER' });
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('#companyWebsite'))).toBeTruthy();
    });

    it('should hide company website field when user type is APPLICANT', () => {
      component.registerForm.patchValue({ userType: 'APPLICANT' });
      fixture.detectChanges();
      
      expect(fixture.debugElement.query(By.css('#companyWebsite'))).toBeFalsy();
    });

    it('should show error message when present', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();
      
      const errorAlert = fixture.debugElement.query(By.css('.alert-error'));
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.nativeElement.textContent).toContain('Test error message');
    });

    it('should hide error message when null', () => {
      component.errorMessage = null;
      fixture.detectChanges();
      
      const errorAlert = fixture.debugElement.query(By.css('.alert-error'));
      expect(errorAlert).toBeFalsy();
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('.submit-button'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        confirmPassword: 'password123'
      });
      fixture.detectChanges();
      
      const submitButton = fixture.debugElement.query(By.css('.submit-button'));
      expect(submitButton.nativeElement.disabled).toBe(false);
    });

    it('should show spinner when submitting', () => {
      component.isSubmitting = true;
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.query(By.css('.spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should hide button content when submitting', () => {
      component.isSubmitting = true;
      fixture.detectChanges();
      
      const buttonContent = fixture.debugElement.query(By.css('.button-content'));
      expect(buttonContent).toBeFalsy();
    });
  });

  describe('Field Validation Display', () => {
    const fillAndTouch = (field: string, value: string = '') => {
      const control = component.registerForm.get(field);
      control?.setValue(value);
      control?.markAsTouched();
      fixture.detectChanges();
    };

    it('should show email required error when touched and empty', () => {
      fillAndTouch('email');
      const error = fixture.debugElement.query(By.css('#email-error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Email is required');
    });

    it('should show email format error when invalid', () => {
      fillAndTouch('email', 'invalid-email');
      const errors = fixture.debugElement.queryAll(By.css('.field-error'));
      const emailError = errors.find(el => el.nativeElement.textContent.includes('valid email'));
      expect(emailError).toBeTruthy();
    });

    it('should show password length error', () => {
      fillAndTouch('password', 'short');
      const errors = fixture.debugElement.queryAll(By.css('.field-error'));
      const lengthError = errors.find(el => el.nativeElement.textContent.includes('8 characters'));
      expect(lengthError).toBeTruthy();
    });

    it('should show password mismatch error', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'different456'
      });
      component.registerForm.get('confirmPassword')?.markAsTouched();
      fixture.detectChanges();
      
      const errors = fixture.debugElement.queryAll(By.css('.field-error'));
      const mismatchError = errors.find(el => el.nativeElement.textContent.includes('do not match'));
      expect(mismatchError).toBeTruthy();
    });

    it('should add error class to invalid touched inputs', () => {
      fillAndTouch('email', 'invalid');
      const input = fixture.debugElement.query(By.css('#email'));
      expect(input.nativeElement.classList.contains('input-error')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on submit button', () => {
      const button = fixture.debugElement.query(By.css('.submit-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Create your account');
    });

    it('should have aria-describedby on inputs with errors', () => {
      const email = fixture.debugElement.query(By.css('#email'));
      expect(email.nativeElement.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should have role="alert" on error messages', () => {
      component.registerForm.get('email')?.markAsTouched();
      fixture.detectChanges();
      
      const error = fixture.debugElement.query(By.css('#email-error'));
      expect(error.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should have proper heading hierarchy', () => {
      const h1 = fixture.debugElement.query(By.css('h1'));
      expect(h1).toBeTruthy();
    });

    it('should have required indicators', () => {
      const required = fixture.debugElement.queryAll(By.css('.required'));
      expect(required.length).toBeGreaterThan(0);
    });
  });
});
