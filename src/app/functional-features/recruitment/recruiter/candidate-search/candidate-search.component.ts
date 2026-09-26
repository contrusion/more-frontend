import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CandidateSearchService, WatchReason } from '../services/candidate-search.service';
import { LivingCvService } from '../../candidate/services/living-cv.service';
import { CandidateClassBadgeComponent } from '../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { CandidateSearchPage, CandidateSearchResult, ExperienceGroup, MarketReadinessTier, PublicLivingCv } from '../../candidate/models/goal.model';

type TierFilter = MarketReadinessTier | null;
type ExperienceFilter = ExperienceGroup | null;

interface FilterOption {
  label: string;
  value: TierFilter;
}

interface ExperienceFilterOption {
  label: string;
  value: ExperienceFilter;
}

interface WatchReasonOption {
  value: WatchReason;
  label: string;
  description: string;
}

@Component({
  selector: 'app-candidate-search',
  standalone: true,
  imports: [CommonModule, CandidateClassBadgeComponent],
  templateUrl: './candidate-search.component.html',
  styleUrls: ['./candidate-search.component.css']
})
export class CandidateSearchComponent implements OnInit {

  results = signal<CandidateSearchResult[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  readonly pageSize = 8;
  activeFilter = signal<TierFilter>(null);
  activeExperienceFilter = signal<ExperienceFilter>(null);

  readonly filterOptions: FilterOption[] = [
    { label: 'All',       value: null        },
    { label: 'Platinum',  value: 'PLATINUM'  },
    { label: 'Gold',      value: 'GOLD'      },
    { label: 'Silver',    value: 'SILVER'    },
    { label: 'Bronze',    value: 'BRONZE'    },
  ];

  readonly experienceFilterOptions: ExperienceFilterOption[] = [
    { label: 'All',             value: null           },
    { label: '< 5 Years',       value: 'EARLY_CAREER' },
    { label: '5+ Years',        value: 'EXPERIENCED'  },
  ];

  // Modal state
  modalOpen = signal(false);
  modalCandidate = signal<CandidateSearchResult | null>(null);
  modalCv = signal<PublicLivingCv | null>(null);
  modalLoading = signal(false);
  modalError = signal<string | null>(null);
  showAllExperience = signal(false);
  showAllSkills = signal(false);
  showAllCertifications = signal(false);
  showAllReferences = signal(false);

  watchModalOpen = signal(false);
  watchCandidate = signal<CandidateSearchResult | null>(null);
  watchReason = signal<WatchReason | null>(null);
  watchNote = signal('');
  watchError = signal<string | null>(null);
  watchSubmitting = signal(false);
  watchSubmittedState = signal<Record<string, 'REQUESTED'>>({});

  readonly watchReasonOptions: WatchReasonOption[] = [
    {
      value: 'SKILL_GAP',
      label: 'Skill Gap',
      description: 'Strong baseline fit, but one key skill or certification is still missing.'
    },
    {
      value: 'EXPERIENCE_GAP',
      label: 'Experience Gap',
      description: 'High potential profile that needs more depth or leadership exposure.'
    },
    {
      value: 'TIMING_GAP',
      label: 'Timing Gap',
      description: 'Great candidate to track for future hiring windows or budgets.'
    },
    {
      value: 'DOMAIN_GAP',
      label: 'Domain Gap',
      description: 'Needs targeted industry exposure before immediate placement.'
    }
  ];

  constructor(
    private searchService: CandidateSearchService,
    private livingCvService: LivingCvService
  ) {}

  ngOnInit(): void {
    this.loadWatchRequestState();
    this.load();
  }

  private loadWatchRequestState(): void {
    this.searchService.getMyWatchRequests().subscribe({
      next: (requests) => {
        const requestedAliases = requests
          .filter((request) => request.status === 'PENDING' || request.status === 'ACCEPTED')
          .reduce<Record<string, 'REQUESTED'>>((acc, request) => {
            acc[request.candidateAlias] = 'REQUESTED';
            return acc;
          }, {});
        this.watchSubmittedState.set(requestedAliases);
      },
      error: () => {
        // Preserve current local state if this bootstrap call fails.
      }
    });
  }

  applyFilter(value: TierFilter): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
    this.load();
  }

  applyExperienceFilter(value: ExperienceFilter): void {
    this.activeExperienceFilter.set(value);
    this.currentPage.set(0);
    this.load();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searchService.searchCandidates(this.activeFilter(), this.activeExperienceFilter(), this.currentPage(), this.pageSize).subscribe({
      next: (data: CandidateSearchPage) => {
        this.results.set(data.content);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load candidates. Please try again.');
        this.loading.set(false);
      }
    });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  formatRoleCategory(raw: string): string {
    return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private readonly tierDescriptions: Record<string, string> = {
    PLATINUM: 'Platinum — elite market-ready: top profile completeness, deep career history, and strong certification portfolio.',
    GOLD: 'Gold — high performer: solid experience, multiple certifications and strong skills portfolio.',
    SILVER: 'Silver — developing talent: building market readiness with growing experience and skills.',
    BRONZE: 'Bronze — early stage: beginning their professional journey with foundational experience.',
  };

  getTierDescription(tier: MarketReadinessTier): string {
    return this.tierDescriptions[tier] ?? tier;
  }

  truncateMessage(text: string, max = 50): string {
    return text && text.length > max ? text.slice(0, max) + '…' : text;
  }

  getRecruiterPitch(): string {
    const candidate = this.modalCandidate();
    if (!candidate) {
      return 'Strong profile with clear growth signals and placement potential.';
    }

    if (candidate.marketReadinessTier === 'PLATINUM') {
      return 'High-confidence placement profile with strong immediate-fit indicators.';
    }

    if (candidate.marketReadinessTier === 'GOLD') {
      return 'Near-market-ready profile with compelling evidence of execution and consistency.';
    }

    if (candidate.marketReadinessTier === 'SILVER') {
      return 'Emerging profile with clear trajectory and coachable upside for targeted roles.';
    }

    return 'Early-stage profile showing foundational quality and measurable growth momentum.';
  }

  getExperienceYearsLabel(): string {
    const cv = this.modalCv();
    if (!cv || cv.workExperience.length === 0) {
      return 'No work history listed';
    }

    let totalMonths = 0;
    for (const item of cv.workExperience) {
      const startDate = new Date(item.startDate);
      const endDate = item.isCurrent || !item.endDate ? new Date() : new Date(item.endDate);
      const months = Math.max(
        0,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
      );
      totalMonths += months;
    }

    const years = totalMonths / 12;
    return `${years.toFixed(1)} years experience`;
  }

  getProofVerificationRate(): number {
    const cv = this.modalCv();
    if (!cv || cv.stats.totalProofItems === 0) {
      return 0;
    }

    return Math.round((cv.stats.verifiedProofItems / cv.stats.totalProofItems) * 100);
  }

  getTopSkills(): string[] {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    return cv.skills
      .slice()
      .sort((a, b) => b.endorsementCount - a.endorsementCount)
      .map((skill) => skill.skillName);
  }

  getDisplayedSkills(): string[] {
    const skills = this.getTopSkills();
    return this.showAllSkills() ? skills : skills.slice(0, 10);
  }

  hasMoreSkills(): boolean {
    return this.getTopSkills().length > 10;
  }

  getDisplayedExperience() {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    return this.showAllExperience() ? cv.workExperience : cv.workExperience.slice(0, 4);
  }

  hasMoreExperience(): boolean {
    const cv = this.modalCv();
    return !!cv && cv.workExperience.length > 4;
  }

  getDisplayedCertifications() {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    return this.showAllCertifications() ? cv.certifications : cv.certifications.slice(0, 4);
  }

  hasMoreCertifications(): boolean {
    const cv = this.modalCv();
    return !!cv && cv.certifications.length > 4;
  }

  getDisplayedReferences() {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    return this.showAllReferences() ? cv.references : cv.references.slice(0, 3);
  }

  hasMoreReferences(): boolean {
    const cv = this.modalCv();
    return !!cv && cv.references.length > 3;
  }

  isWatchRequested(alias: string): boolean {
    return this.watchSubmittedState()[alias] === 'REQUESTED';
  }

  openWatchModal(candidate: CandidateSearchResult): void {
    this.watchCandidate.set(candidate);
    this.watchReason.set(null);
    this.watchNote.set('');
    this.watchError.set(null);
    this.watchModalOpen.set(true);
  }

  selectWatchReason(reason: WatchReason): void {
    this.watchReason.set(reason);
    this.watchError.set(null);
  }

  updateWatchNote(value: string): void {
    this.watchNote.set(value);
  }

  submitWatchRequest(): void {
    const candidate = this.watchCandidate();
    const reason = this.watchReason();

    if (!candidate) {
      this.watchError.set('No candidate selected for watch request.');
      return;
    }

    if (!reason) {
      this.watchError.set('Please select a watch reason before sending the request.');
      return;
    }

    this.watchSubmitting.set(true);
    this.watchError.set(null);

    this.searchService.createWatchRequest({
      candidateAlias: candidate.publicAlias,
      triggerReason: reason,
      recruiterNote: this.watchNote().trim() || undefined
    }).subscribe({
      next: () => {
        this.watchSubmittedState.update((current) => ({
          ...current,
          [candidate.publicAlias]: 'REQUESTED'
        }));
        this.watchSubmitting.set(false);
        this.closeWatchModal();
      },
      error: (error: HttpErrorResponse) => {
        this.watchSubmitting.set(false);
        this.watchError.set(
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'Could not send watch request. Please try again.'
        );
      }
    });
  }

  closeWatchModal(): void {
    this.watchModalOpen.set(false);
    this.watchCandidate.set(null);
    this.watchReason.set(null);
    this.watchNote.set('');
    this.watchError.set(null);
    this.watchSubmitting.set(false);
  }

  openModal(candidate: CandidateSearchResult): void {
    this.modalCandidate.set(candidate);
    this.modalCv.set(null);
    this.modalError.set(null);
    this.modalLoading.set(true);
    this.modalOpen.set(true);
    this.showAllExperience.set(false);
    this.showAllSkills.set(false);
    this.showAllCertifications.set(false);
    this.showAllReferences.set(false);

    this.livingCvService.getPublicLivingCv(candidate.publicAlias).subscribe({
      next: (cv) => {
        this.modalCv.set(cv);
        this.modalLoading.set(false);
      },
      error: () => {
        this.modalError.set('Could not load Living CV. Please try again.');
        this.modalLoading.set(false);
      }
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.modalCandidate.set(null);
    this.modalCv.set(null);
  }
}
