import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JobAdService } from './services/job-ad.service';
import { JobAdFormComponent } from './job-ad-form/job-ad-form.component';
import {
  ExperienceLevel,
  JobAdvertisement,
  JobType,
} from './models/job-advertisement.model';

@Component({
  selector: 'app-job-ads-list',
  standalone: true,
  imports: [CommonModule, JobAdFormComponent],
  templateUrl: './job-ads-list.component.html',
  styleUrls: ['./job-ads-list.component.css'],
})
export class JobAdsListComponent implements OnInit {
  jobAds = signal<JobAdvertisement[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  formOpen = signal(false);
  editingAd = signal<JobAdvertisement | null>(null);

  constructor(
    private jobAdService: JobAdService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.jobAdService.getMyAds().subscribe({
      next: (ads) => {
        this.jobAds.set(ads);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load job advertisements. Please try again.');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingAd.set(null);
    this.formOpen.set(true);
  }

  openEdit(ad: JobAdvertisement): void {
    this.editingAd.set(ad);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingAd.set(null);
  }

  onSaved(): void {
    this.closeForm();
    this.load();
  }

  deactivate(ad: JobAdvertisement): void {
    if (!confirm(`Deactivate "${ad.title}"? It will no longer appear to candidates.`)) return;
    this.jobAdService.deactivate(ad.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to deactivate. Please try again.'),
    });
  }

  openApplicants(ad: JobAdvertisement): void {
    this.router.navigate(['/recruiter/job-ads', ad.id, 'applicants']);
  }

  labelForJobType(jt: JobType): string {
    const map: Record<JobType, string> = {
      [JobType.FULL_TIME]: 'Full Time',
      [JobType.PART_TIME]: 'Part Time',
      [JobType.CONTRACT]: 'Contract',
      [JobType.INTERNSHIP]: 'Internship',
      [JobType.FREELANCE]: 'Freelance',
      [JobType.TEMPORARY]: 'Temporary',
    };
    return map[jt] ?? jt;
  }

  labelForExperience(el: ExperienceLevel): string {
    const map: Record<ExperienceLevel, string> = {
      [ExperienceLevel.ENTRY_LEVEL]: 'Entry Level',
      [ExperienceLevel.JUNIOR]: 'Junior',
      [ExperienceLevel.MID_LEVEL]: 'Mid Level',
      [ExperienceLevel.SENIOR]: 'Senior',
      [ExperienceLevel.LEAD]: 'Lead',
      [ExperienceLevel.MANAGER]: 'Manager',
      [ExperienceLevel.DIRECTOR]: 'Director',
      [ExperienceLevel.EXECUTIVE]: 'Executive',
    };
    return map[el] ?? el;
  }
}

