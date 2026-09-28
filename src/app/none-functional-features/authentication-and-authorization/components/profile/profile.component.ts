import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { AccountProfile, AuthService, UpdateAccountProfileRequest } from '../../services/auth.service';

interface ProfileUserData {
  name?: string;
  preferred_username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

interface ProfileCompletenessItem {
  label: string;
  description: string;
  complete: boolean;
}

type TalentPersona = 'PASSIVE_PROSPECT' | 'WARM_LEAD' | 'ACTIVE_JOB_SEEKER';

type PreferredContactMethod = '' | 'EMAIL' | 'PHONE' | 'WHATSAPP' | 'LINKEDIN';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    FieldsetModule,
    CheckboxModule,
    ProgressBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly personaOptions = [
    {
      value: 'PASSIVE_PROSPECT' as const,
      label: 'Passive Prospect',
      description: 'Currently employed and only open to standout opportunities.'
    },
    {
      value: 'WARM_LEAD' as const,
      label: 'Warm Lead',
      description: 'Exploring a move and open to conversations in the next few months.'
    },
    {
      value: 'ACTIVE_JOB_SEEKER' as const,
      label: 'Active Job Seeker',
      description: 'Actively interviewing and prioritising rapid opportunities.'
    }
  ];
  readonly contactMethodOptions = [
    { value: '', label: 'No preference set' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'LINKEDIN', label: 'LinkedIn' }
  ];
  readonly availabilityOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly userName = signal('User');
  readonly userEmail = signal('');
  readonly userRoles = signal<string[]>([]);
  readonly persona = signal('PASSIVE_PROSPECT');
  readonly availability = signal(3);
  readonly bio = signal('Not provided');
  readonly location = signal('Not provided');
  readonly phoneNumber = signal('Not provided');
  readonly preferredContactMethod = signal('Not provided');
  readonly registrationDate = signal('');
  readonly lastLogin = signal('Not available');
  readonly loginCount = signal('0');
  readonly currentJobTitle = signal('Not available');
  readonly companyWebsite = signal('Not provided');
  readonly editDrawerOpen = signal(false);
  readonly saveMessage = signal('');
  readonly saveError = signal('');
  readonly isSaving = signal(false);
  readonly currentProfile = signal<AccountProfile | null>(null);
  readonly isRecruiter = computed(() => this.currentProfile()?.userTypes.includes('RECRUITER') ?? false);
  readonly profileCompletenessItems = computed<ProfileCompletenessItem[]>(() => [
    {
      label: 'Identity',
      description: 'Name and email are present.',
      complete: this.userName() !== 'User' && this.userEmail().trim().length > 0
    },
    {
      label: 'Professional snapshot',
      description: 'Current role and location are set.',
      complete: this.hasValue(this.currentJobTitle()) && this.hasValue(this.location())
    },
    {
      label: 'Contact details',
      description: 'Phone number and preferred contact method are available.',
      complete: this.hasValue(this.phoneNumber()) && this.hasValue(this.preferredContactMethod())
    },
    {
      label: 'Biography',
      description: 'About section has been written.',
      complete: this.hasValue(this.bio())
    },
    {
      label: 'Preferences',
      description: 'Persona and availability are configured.',
      complete: this.persona().trim().length > 0 && this.availability() > 0
    }
  ]);
  readonly profileCompletenessPercent = computed(() => {
    const items = this.profileCompletenessItems();
    const completed = items.filter(item => item.complete).length;

    return Math.round((completed / items.length) * 100);
  });
  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    email: [{ value: '', disabled: true }],
    location: ['', [Validators.maxLength(255)]],
    phoneNumber: ['', [Validators.maxLength(50)]],
    preferredContactMethod: ['' as PreferredContactMethod],
    talentPersona: ['PASSIVE_PROSPECT' as TalentPersona, [Validators.required]],
    availableInMonths: [3, [Validators.required, Validators.min(1), Validators.max(12)]],
    companyWebsite: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i)]],
    bio: ['', [Validators.maxLength(2000)]]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.authService.userData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(userData => {
        const profile = (userData ?? {}) as ProfileUserData;
        this.userName.set(profile.name || profile.preferred_username || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || 'User');
        this.userEmail.set(profile.email || '');
        this.userRoles.set(this.authService.getUserRoles());
        this.persona.set(this.authService.getUserPersona() ?? 'PASSIVE_PROSPECT');
        this.availability.set(this.authService.getUserAvailabilityInMonths());
      });

    this.authService.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(profile => {
        this.applyProfile(profile);
      });
  }

  get userInitials(): string {
    const name = this.userName();
    const parts = name.split(' ').filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  get personaLabel(): string {
    switch (this.persona()) {
      case 'ACTIVE_JOB_SEEKER':
        return 'Active Job Seeker';
      case 'WARM_LEAD':
        return `Warm lead, open in ${this.availability()} month${this.availability() === 1 ? '' : 's'}`;
      default:
        return 'Passive Prospect';
    }
  }

  get selectedPersonaDescription(): string {
    return this.personaOptions.find(option => option.value === this.profileForm.controls.talentPersona.value)?.description
      ?? 'Select the persona that best matches your current job search posture.';
  }

  openEditDrawer(): void {
    this.saveMessage.set('');
    this.saveError.set('');
    this.syncFormFromProfile();
    this.editDrawerOpen.set(true);
  }

  closeEditDrawer(): void {
    this.editDrawerOpen.set(false);
    this.saveError.set('');
  }

  onDrawerStateChange(opened: boolean): void {
    this.editDrawerOpen.set(opened);
    if (!opened) {
      this.saveError.set('');
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();
    const payload: UpdateAccountProfileRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      bio: formValue.bio.trim(),
      location: formValue.location.trim(),
      phoneNumber: formValue.phoneNumber.trim(),
      preferredContactMethod: formValue.preferredContactMethod.trim() || '',
      talentPersona: formValue.talentPersona,
      availableInMonths: formValue.availableInMonths,
      companyWebsite: this.isRecruiter() ? formValue.companyWebsite.trim() || null : null
    };

    this.isSaving.set(true);
    this.saveError.set('');

    this.authService.updateMyProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.applyProfile(profile);
          this.authService.setUserPersona(profile.talentPersona ?? formValue.talentPersona);
          this.authService.setUserAvailabilityInMonths(profile.availableInMonths ?? formValue.availableInMonths);
          this.saveMessage.set('Profile updated successfully.');
          this.closeEditDrawer();
          this.isSaving.set(false);
        },
        error: () => {
          this.saveError.set('Unable to save your changes right now. Please review the form and try again.');
          this.isSaving.set(false);
        }
      });
  }

  private formatRegistrationDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
      return value;
    }

    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private formatLoginCount(value: number | null | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '0';
    }

    return new Intl.NumberFormat('en-ZA').format(value);
  }

  private hasValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && normalized !== 'not provided' && normalized !== 'not available';
  }

  private applyProfile(profile: AccountProfile): void {
    this.currentProfile.set(profile);
    this.userName.set([profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'User');
    this.userEmail.set(profile.email || '');
    this.persona.set(profile.talentPersona ?? this.authService.getUserPersona() ?? 'PASSIVE_PROSPECT');
    this.availability.set(profile.availableInMonths ?? this.authService.getUserAvailabilityInMonths());
    this.currentJobTitle.set(profile.jobTitle?.trim() || 'Not available');
    this.bio.set(profile.bio?.trim() || 'Not provided');
    this.location.set(profile.location?.trim() || 'Not provided');
    this.phoneNumber.set(profile.phoneNumber?.trim() || 'Not provided');
    this.preferredContactMethod.set(profile.preferredContactMethod?.trim() || 'Not provided');
    this.companyWebsite.set(profile.companyWebsite?.trim() || 'Not provided');
    this.registrationDate.set(profile.createdAt ? this.formatRegistrationDate(profile.createdAt) : 'Not available');
    this.lastLogin.set(profile.lastLogin ? this.formatDateTime(profile.lastLogin) : 'Not available');
    this.loginCount.set(this.formatLoginCount(profile.loginCount));
    this.syncFormFromProfile(profile);
  }

  private syncFormFromProfile(profile = this.currentProfile()): void {
    if (!profile) {
      return;
    }

    this.profileForm.reset({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      location: profile.location ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      preferredContactMethod: this.normalizeContactMethod(profile.preferredContactMethod),
      talentPersona: (profile.talentPersona ?? 'PASSIVE_PROSPECT') as TalentPersona,
      availableInMonths: profile.availableInMonths ?? 3,
      companyWebsite: profile.companyWebsite ?? '',
      bio: profile.bio ?? ''
    });
  }

  private normalizeContactMethod(value: string | null): PreferredContactMethod {
    switch (value?.trim().toUpperCase()) {
      case 'EMAIL':
      case 'PHONE':
      case 'WHATSAPP':
      case 'LINKEDIN':
        return value.trim().toUpperCase() as PreferredContactMethod;
      default:
        return '';
    }
  }

  isFallbackValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'not provided' || normalized === 'not available';
  }
}
