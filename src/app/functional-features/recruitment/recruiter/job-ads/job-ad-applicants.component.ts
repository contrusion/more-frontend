import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LivingCvService } from '../../candidate/services/living-cv.service';
import { PublicLivingCv } from '../../candidate/models/goal.model';
import { JobAdService } from './services/job-ad.service';
import { JobApplicantListItem } from './models/job-advertisement.model';

@Component({
  selector: 'app-job-ad-applicants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-ad-applicants.component.html',
  styleUrls: ['./job-ad-applicants.component.css'],
  providers: [DatePipe],
})
export class JobAdApplicantsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobAdService = inject(JobAdService);
  private readonly livingCvService = inject(LivingCvService);

  applicants = signal<JobApplicantListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  jobAdId = signal<string | null>(null);

  modalOpen = signal(false);
  modalCandidate = signal<JobApplicantListItem | null>(null);
  modalCv = signal<PublicLivingCv | null>(null);
  modalLoading = signal(false);
  modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('jobAdId');
      this.jobAdId.set(id);
      if (id) {
        this.load(id);
      } else {
        this.error.set('Job advertisement not found.');
        this.loading.set(false);
      }
    });
  }

  load(jobAdId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.jobAdService.getInterestedApplicants(jobAdId).subscribe({
      next: (applicants) => {
        this.applicants.set(applicants);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load applicants for this role. Please try again.');
        this.loading.set(false);
      },
    });
  }

  backToJobAds(): void {
    this.router.navigate(['/recruiter/job-ads']);
  }

  private getValidApplicationId(applicant: JobApplicantListItem | null | undefined): string | null {
    const applicationId = applicant?.applicationId?.trim();
    return applicationId ? applicationId : null;
  }

  private openLivingCv(applicant: JobApplicantListItem): void {
    this.modalCandidate.set(applicant);
    this.modalCv.set(null);
    this.modalError.set(null);
    this.modalLoading.set(true);
    this.modalOpen.set(true);

    this.livingCvService.getPublicLivingCv(applicant.publicAlias).subscribe({
      next: (cv) => {
        this.modalCv.set(cv);
        this.modalLoading.set(false);
      },
      error: () => {
        this.modalError.set('Could not load this candidate’s Living CV. Please try again.');
        this.modalLoading.set(false);
      },
    });
  }

  private updateApplicationStatus(applicant: JobApplicantListItem, status: string, reason?: string): void {
    const applicationId = this.getValidApplicationId(applicant);
    if (!applicationId) {
      this.modalError.set('This applicant record is missing a valid application id.');
      this.error.set('This applicant record is missing a valid application id.');
      return;
    }

    this.modalError.set(null);
    this.error.set(null);
    this.modalLoading.set(true);

    this.jobAdService.updateApplicationStatus(applicationId, status, reason).subscribe({
      next: (updated) => {
        this.applicants.update((items) =>
          items.map((item) =>
            item.applicationId === applicationId
              ? { ...item, status: updated.status ?? item.status }
              : item,
          ),
        );

        this.modalLoading.set(false);
      },
      error: () => {
        const label = status.replace(/_/g, ' ').toLowerCase();
        this.modalError.set(`Could not move this application to ${label}. Please try again.`);
        this.error.set(`Could not move this application to ${label}. Please try again.`);
        this.modalLoading.set(false);
      },
    });
  }

  viewApplication(applicant: JobApplicantListItem): void {
    const applicationId = this.getValidApplicationId(applicant);
    if (!applicationId) {
      this.modalError.set('This applicant record is missing a valid application id.');
      return;
    }

    this.modalError.set(null);
    this.modalLoading.set(true);

    this.jobAdService.updateApplicationStatus(applicationId, 'REVIEWED').subscribe({
      next: (updated) => {
        this.applicants.update((items) =>
          items.map((item) =>
            item.applicationId === applicationId
              ? { ...item, status: updated.status ?? item.status }
              : item,
          ),
        );

        this.openLivingCv(applicant);
      },
      error: () => {
        this.modalError.set('Could not mark the application as reviewed. Please try again.');
        this.modalLoading.set(false);
      },
    });
  }

  proceedToScreening(applicant: JobApplicantListItem): void {
    this.updateApplicationStatus(applicant, 'SCREENING');
  }

  rejectApplication(applicant: JobApplicantListItem): void {
    this.updateApplicationStatus(applicant, 'REJECTED');
  }

  putOnHold(applicant: JobApplicantListItem): void {
    const reason = window.prompt('Please enter the hold reason for this application:');
    if (!reason || !reason.trim()) {
      this.modalError.set('A hold reason is required before placing this application on hold.');
      return;
    }

    this.updateApplicationStatus(applicant, 'ON_HOLD', reason.trim());
  }

  openCv(applicant: JobApplicantListItem): void {
    this.openLivingCv(applicant);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.modalCandidate.set(null);
    this.modalCv.set(null);
    this.modalError.set(null);
  }

  formatTier(value?: string): string {
    if (!value) {
      return 'Unclassified';
    }

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  formatDate(value?: string): string {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
