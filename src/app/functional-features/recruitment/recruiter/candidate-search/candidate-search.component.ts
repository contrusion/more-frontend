import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateSearchService } from '../services/candidate-search.service';
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
  activeFilter = signal<TierFilter>(null);
  activeExperienceFilter = signal<ExperienceFilter>(null);

  readonly filterOptions: FilterOption[] = [
    { label: 'All',           value: null        },
    { label: '💎 Platinum',   value: 'PLATINUM'  },
    { label: '🥇 Gold',      value: 'GOLD'      },
    { label: '🥈 Silver',    value: 'SILVER'    },
    { label: '🥉 Bronze',    value: 'BRONZE'    },
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

  constructor(
    private searchService: CandidateSearchService,
    private livingCvService: LivingCvService
  ) {}

  ngOnInit(): void {
    this.load();
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
    this.searchService.searchCandidates(this.activeFilter(), this.activeExperienceFilter(), this.currentPage()).subscribe({
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

  openModal(candidate: CandidateSearchResult): void {
    this.modalCandidate.set(candidate);
    this.modalCv.set(null);
    this.modalError.set(null);
    this.modalLoading.set(true);
    this.modalOpen.set(true);

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
