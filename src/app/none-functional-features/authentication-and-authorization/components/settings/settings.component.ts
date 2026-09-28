import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export type TalentPersonaOption = {
  value: 'PASSIVE_PROSPECT' | 'WARM_LEAD' | 'ACTIVE_JOB_SEEKER';
  label: string;
  description: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  readonly personaOptions: TalentPersonaOption[] = [
    {
      value: 'PASSIVE_PROSPECT',
      label: 'Passive Prospect',
      description: 'Currently employed and only open to standout opportunities.'
    },
    {
      value: 'WARM_LEAD',
      label: 'Warm Lead',
      description: 'Exploring a move and open to conversations in the next few months.'
    },
    {
      value: 'ACTIVE_JOB_SEEKER',
      label: 'Active Job Seeker',
      description: 'Actively interviewing and prioritising rapid opportunities.'
    }
  ];

  profileForm: FormGroup;
  selectedPersona = 'PASSIVE_PROSPECT';
  availabilityMonths = 3;
  savedMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      persona: ['PASSIVE_PROSPECT', Validators.required],
      availableInMonths: [3, [Validators.required, Validators.min(1), Validators.max(12)]]
    });
  }

  ngOnInit(): void {
    const currentPersona = this.authService.getUserPersona() ?? 'PASSIVE_PROSPECT';
    const currentAvailability = this.authService.getUserAvailabilityInMonths();

    this.selectedPersona = currentPersona;
    this.availabilityMonths = currentAvailability;
    this.profileForm.patchValue({
      persona: currentPersona,
      availableInMonths: currentAvailability
    });

    this.profileForm.get('persona')?.valueChanges.subscribe(value => {
      this.selectedPersona = value;
    });

    this.profileForm.get('availableInMonths')?.valueChanges.subscribe(value => {
      this.availabilityMonths = Number(value ?? 3);
    });
  }

  get selectedPersonaLabel(): string {
    return this.personaOptions.find(option => option.value === this.selectedPersona)?.label ?? 'Passive Prospect';
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const persona = this.profileForm.value.persona as 'PASSIVE_PROSPECT' | 'WARM_LEAD' | 'ACTIVE_JOB_SEEKER';
    const availableInMonths = this.profileForm.value.availableInMonths ?? 3;

    this.authService.setUserPersona(persona);
    this.authService.setUserAvailabilityInMonths(availableInMonths);
    this.savedMessage = 'Your persona and availability have been updated.';
  }

  get availabilitySummary(): string {
    if (this.selectedPersona === 'ACTIVE_JOB_SEEKER') {
      return 'Available immediately';
    }

    if (this.selectedPersona === 'WARM_LEAD') {
      return `Open to offers in ${this.availabilityMonths} month${this.availabilityMonths === 1 ? '' : 's'}`;
    }

    return 'Private profile by default';
  }
}
