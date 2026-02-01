import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userType: ['APPLICANT', Validators.required],
      jobTitle: ['', Validators.required],
      companyWebsite: [''],
      bio: ['', [Validators.required, Validators.minLength(20)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Update company website validation based on user type
    this.registerForm.get('userType')?.valueChanges.subscribe(userType => {
      const companyWebsiteControl = this.registerForm.get('companyWebsite');
      if (userType === 'RECRUITER') {
        companyWebsiteControl?.setValidators([Validators.required]);
      } else {
        companyWebsiteControl?.clearValidators();
      }
      companyWebsiteControl?.updateValueAndValidity();
    });
  }
  
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
  
  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = null;
    
    const userData = {
      email: this.registerForm.value.email,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      enabled: true,
      userTypes: [this.registerForm.value.userType],
      jobTitle: this.registerForm.value.jobTitle,
      companyWebsite: this.registerForm.value.companyWebsite || undefined,
      bio: this.registerForm.value.bio,
      credentials: [
        {
          type: 'password',
          value: this.registerForm.value.password,
          temporary: false
        }
      ]
    };
    
    // You need to set up a proxy in your Angular app or a backend service to handle this
    // Direct calls from the browser to Keycloak Admin API are not recommended for security reasons
    this.http.post('http://localhost:8081/api/v1/accounts/register', userData).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Navigate to login screen after successful registration
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
  
  goToLogin() {
    this.router.navigate(['/login']);
  }
}