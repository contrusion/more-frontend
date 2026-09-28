import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthService } from '../../services/auth.service';

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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FieldsetModule, CheckboxModule, ProgressBarModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
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
        this.currentJobTitle.set(profile.jobTitle || 'Not available');
        this.bio.set(profile.bio?.trim() || 'Not provided');
        this.location.set(profile.location?.trim() || 'Not provided');
        this.phoneNumber.set(profile.phoneNumber?.trim() || 'Not provided');
        this.preferredContactMethod.set(profile.preferredContactMethod?.trim() || 'Not provided');
        this.registrationDate.set(profile.createdAt ? this.formatRegistrationDate(profile.createdAt) : 'Not available');
        this.lastLogin.set(profile.lastLogin ? this.formatDateTime(profile.lastLogin) : 'Not available');
        this.loginCount.set(this.formatLoginCount(profile.loginCount));
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
}
