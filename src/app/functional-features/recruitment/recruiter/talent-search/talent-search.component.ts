import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { CandidateClassBadgeComponent } from '../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { CandidateSearchPage, CandidateSearchResult, ExperienceGroup, MarketReadinessTier } from '../../candidate/models/goal.model';
import { CandidateSearchService } from '../services/candidate-search.service';

type TierFilter = MarketReadinessTier | null;
type ExperienceFilter = ExperienceGroup | null;

@Component({
  selector: 'app-talent-search',
  standalone: true,
  imports: [CommonModule, CandidateClassBadgeComponent],
  templateUrl: './talent-search.component.html',
  styleUrls: ['../candidate-search/candidate-search.component.css']
})
export class TalentSearchComponent implements OnInit {
  results = signal<CandidateSearchResult[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  activeFilter = signal<TierFilter>(null);
  activeExperienceFilter = signal<ExperienceFilter>(null);
  keyword = signal('');
  industry = signal('');
  roleCategory = signal<string | null>(null);

  readonly filterOptions: Array<{ label: string; value: TierFilter }> = [
    { label: 'All', value: null },
    { label: '💎 Platinum', value: 'PLATINUM' },
    { label: '🥇 Gold', value: 'GOLD' },
    { label: '🥈 Silver', value: 'SILVER' },
    { label: '🥉 Bronze', value: 'BRONZE' }
  ];

  readonly experienceFilterOptions: Array<{ label: string; value: ExperienceFilter }> = [
    { label: 'All', value: null },
    { label: '< 5 Years', value: 'EARLY_CAREER' },
    { label: '5+ Years', value: 'EXPERIENCED' }
  ];

  readonly roleOptions = [
    { label: 'All roles', value: null },
    { label: 'Software Engineer', value: 'SOFTWARE_ENGINEER' },
    { label: 'Data Scientist', value: 'DATA_SCIENTIST' },
    { label: 'Product Manager', value: 'PRODUCT_MANAGER' },
    { label: 'UX Designer', value: 'UX_DESIGNER' },
    { label: 'Business Analyst', value: 'BUSINESS_ANALYST' },
    { label: 'Other', value: 'OTHER' }
  ];

  constructor(private searchService: CandidateSearchService) {}

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

  applySearch(): void {
    this.currentPage.set(0);
    this.load();
  }

  resetFilters(): void {
    this.activeFilter.set(null);
    this.activeExperienceFilter.set(null);
    this.keyword.set('');
    this.roleCategory.set(null);
    this.industry.set('');
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

    this.searchService.searchCandidates(
      this.activeFilter(),
      this.activeExperienceFilter(),
      this.currentPage(),
      20,
      this.keyword(),
      this.roleCategory(),
      this.industry()
    ).subscribe({
      next: (data: CandidateSearchPage) => {
        this.results.set(data.content);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load talent candidates. Please try again.');
        this.loading.set(false);
      }
    });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index);
  }

  formatRoleCategory(raw: string): string {
    return raw.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  truncateMessage(text: string, max = 50): string {
    return text && text.length > max ? text.slice(0, max) + '…' : text;
  }
}
