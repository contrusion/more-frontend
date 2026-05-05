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

  roleCategoryOptions = [
    { value: 'FRONTEND_ENGINEER', label: 'Frontend Engineer' },
    { value: 'BACKEND_ENGINEER', label: 'Backend Engineer' },
    { value: 'FULLSTACK_ENGINEER', label: 'Full Stack Engineer' },
    { value: 'MOBILE_ENGINEER', label: 'Mobile Engineer' },
    { value: 'DEVOPS_ENGINEER', label: 'DevOps Engineer' },
    { value: 'DATA_ENGINEER', label: 'Data Engineer' },
    { value: 'ML_ENGINEER', label: 'ML Engineer' },
    { value: 'CLOUD_ENGINEER', label: 'Cloud Engineer' },
    { value: 'SECURITY_ENGINEER', label: 'Security Engineer' },
    { value: 'EMBEDDED_ENGINEER', label: 'Embedded Engineer' },
    { value: 'QA_ENGINEER', label: 'QA Engineer' },
    { value: 'SOFTWARE_ENGINEER', label: 'Software Engineer' },
    { value: 'DATA_SCIENTIST', label: 'Data Scientist' },
    { value: 'DATA_ANALYST', label: 'Data Analyst' },
    { value: 'BI_DEVELOPER', label: 'BI Developer' },
    { value: 'SOLUTIONS_ARCHITECT', label: 'Solutions Architect' },
    { value: 'TECH_LEAD', label: 'Tech Lead' },
    { value: 'ENGINEERING_MANAGER', label: 'Engineering Manager' },
    { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
    { value: 'UX_DESIGNER', label: 'UX Designer' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
    { value: 'BUSINESS_ANALYST', label: 'Business Analyst' },
    { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'RECRUITER', label: 'Recruiter' },
    { value: 'MARKETING_SPECIALIST', label: 'Marketing Specialist' },
    { value: 'SALES_REPRESENTATIVE', label: 'Sales Representative' },
    { value: 'LEGAL_COUNSEL', label: 'Legal Counsel' },
    { value: 'PARALEGAL', label: 'Paralegal' },
    { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
    { value: 'DOCTOR', label: 'Doctor / Physician' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'PHARMACIST', label: 'Pharmacist' },
    { value: 'HEALTHCARE_ADMINISTRATOR', label: 'Healthcare Administrator' },
    { value: 'CIVIL_ENGINEER', label: 'Civil Engineer' },
    { value: 'MECHANICAL_ENGINEER', label: 'Mechanical Engineer' },
    { value: 'ELECTRICAL_ENGINEER', label: 'Electrical Engineer' },
    { value: 'CHEMICAL_ENGINEER', label: 'Chemical Engineer' },
    { value: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
    { value: 'SUPPLY_CHAIN_MANAGER', label: 'Supply Chain Manager' },
    { value: 'LOGISTICS_COORDINATOR', label: 'Logistics Coordinator' },
    { value: 'CUSTOMER_SERVICE_REP', label: 'Customer Service Representative' },
    { value: 'CUSTOMER_SUCCESS_MANAGER', label: 'Customer Success Manager' },
    { value: 'GRAPHIC_DESIGNER', label: 'Graphic Designer' },
    { value: 'CONTENT_WRITER', label: 'Copywriter / Content Writer' },
    { value: 'VIDEOGRAPHER', label: 'Videographer / Photographer' },
    { value: 'EDUCATOR', label: 'Teacher / Educator' },
    { value: 'CORPORATE_TRAINER', label: 'Corporate Trainer' },
    { value: 'ADMINISTRATIVE_ASSISTANT', label: 'Administrative Assistant' },
    { value: 'EXECUTIVE_ASSISTANT', label: 'Executive Assistant' },
    { value: 'OFFICE_MANAGER', label: 'Office Manager' },
    { value: 'OTHER', label: 'Other / Not Listed' },
  ];

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
      roleCategory: ['', Validators.required],
      companyWebsite: [''],
      bio: ['', [Validators.required, Validators.minLength(20)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Update validators based on user type
    this.registerForm.get('userType')?.valueChanges.subscribe(userType => {
      const companyWebsiteControl = this.registerForm.get('companyWebsite');
      const roleCategoryControl = this.registerForm.get('roleCategory');
      if (userType === 'RECRUITER') {
        companyWebsiteControl?.setValidators([Validators.required]);
        roleCategoryControl?.clearValidators();
      } else {
        companyWebsiteControl?.clearValidators();
        roleCategoryControl?.setValidators([Validators.required]);
      }
      companyWebsiteControl?.updateValueAndValidity();
      roleCategoryControl?.updateValueAndValidity();
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
      roleCategory: this.registerForm.value.roleCategory || undefined,
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