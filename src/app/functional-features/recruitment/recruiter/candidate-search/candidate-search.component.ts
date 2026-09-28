import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TimelineModule } from 'primeng/timeline';
import { CandidateSearchService, WatchReason } from '../services/candidate-search.service';
import { LivingCvService } from '../../candidate/services/living-cv.service';
import { CandidateClassBadgeComponent } from '../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { CandidateSearchPage, CandidateSearchResult, CandidateSkill, ExperienceGroup, MarketReadinessTier, PublicLivingCv } from '../../candidate/models/goal.model';

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

type CvDetailTab = 'SKILLS' | 'CERTIFICATIONS' | 'REFERENCES' | 'GROWTH';
type ExecutiveStep = 'ABOUT' | 'HIGHLIGHTS' | 'ASPIRATIONS';

interface PassionCard {
  title: string;
  frontDescription: string;
  backTitle: string;
  backDescription: string;
}

interface WorkTimelineEvent {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-candidate-search',
  standalone: true,
  imports: [CommonModule, CandidateClassBadgeComponent, TimelineModule],
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
  activeCvDetailTab = signal<CvDetailTab>('SKILLS');
  activeExecutiveStep = signal<ExecutiveStep>('ABOUT');

  watchModalOpen = signal(false);
  watchCandidate = signal<CandidateSearchResult | null>(null);
  watchReason = signal<WatchReason | null>(null);
  watchNote = signal('');
  watchFocusInput = signal('');
  watchFocusAreas = signal<string[]>([]);
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

  getGoalProgressPercent(): number {
    const cv = this.modalCv();
    if (!cv || cv.stats.totalGoals === 0) {
      return 0;
    }

    return Math.round((cv.stats.completedGoals / cv.stats.totalGoals) * 100);
  }

  getMilestoneProgressPercent(): number {
    const cv = this.modalCv();
    if (!cv || cv.stats.totalMilestones === 0) {
      return 0;
    }

    // Current public CV stats expose total milestones, with verified proof used as completion-quality signal.
    return Math.round((cv.stats.verifiedProofItems / cv.stats.totalMilestones) * 100);
  }

  getExecutiveSummaryPoints(): string[] {
    const candidate = this.modalCandidate();
    const cv = this.modalCv();
    if (!candidate || !cv) {
      return [];
    }

    const highlights: string[] = [];
    highlights.push(`${candidate.marketReadinessTier} tier profile with a readiness score of ${candidate.marketReadinessScore}.`);
    highlights.push(`${this.getExperienceYearsLabel()} and ${cv.workExperience.length} recorded work history item${cv.workExperience.length === 1 ? '' : 's'}.`);
    highlights.push(`${cv.stats.completedGoals} of ${cv.stats.totalGoals} goals completed, with ${cv.stats.inProgressGoals} currently in progress.`);
    highlights.push(`${cv.stats.verifiedProofItems} verified proof item${cv.stats.verifiedProofItems === 1 ? '' : 's'} across ${cv.stats.totalMilestones} milestones.`);

    const topSkills = this.getTopSkills().slice(0, 3);
    if (topSkills.length > 0) {
      highlights.push(`Top capability signals: ${topSkills.join(', ')}.`);
    }

    return highlights;
  }

  setExecutiveStep(step: ExecutiveStep): void {
    this.activeExecutiveStep.set(step);
  }

  executiveSteps(): Array<{ key: ExecutiveStep; label: string }> {
    return [
      { key: 'ABOUT', label: 'About' },
      { key: 'HIGHLIGHTS', label: 'Career Highlights' },
      { key: 'ASPIRATIONS', label: 'Career Aspirations' }
    ];
  }

  getExecutiveAboutText(): string {
    const biography = this.modalCv()?.profile.biography?.trim();
    if (biography) {
      return biography;
    }
    return 'No biography has been shared yet. This profile is still building its narrative through proven outcomes and progression.';
  }

  getExecutiveHighlights(): string[] {
    const candidate = this.modalCandidate();
    const cv = this.modalCv();
    if (!candidate || !cv) {
      return [];
    }

    const highlights: string[] = [];
    highlights.push(`${candidate.marketReadinessTier} tier with a readiness score of ${candidate.marketReadinessScore}.`);
    highlights.push(`${this.getExperienceYearsLabel()} across ${cv.workExperience.length} recorded role${cv.workExperience.length === 1 ? '' : 's'}.`);
    highlights.push(`${cv.stats.completedGoals}/${cv.stats.totalGoals} goals completed and ${cv.stats.verifiedProofItems} verified proof item${cv.stats.verifiedProofItems === 1 ? '' : 's'}.`);

    const topSkills = this.getTopSkills().slice(0, 3);
    if (topSkills.length > 0) {
      highlights.push(`Core strengths include ${topSkills.join(', ')}.`);
    }

    return highlights;
  }

  getExecutiveAspirations(): string[] {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    const explicitGoals = cv.stats.totalGoals > 0
      ? [`Advancing ${cv.stats.inProgressGoals} active goal${cv.stats.inProgressGoals === 1 ? '' : 's'} toward higher readiness outcomes.`]
      : [];

    const goalTitles = this.extractAspirationGoalTitles();
    if (goalTitles.length > 0) {
      return [
        ...explicitGoals,
        ...goalTitles.map((goal) => `Working toward: ${goal}.`)
      ];
    }

    const topSkills = this.getTopSkills().slice(0, 2);
    if (topSkills.length > 0) {
      return [
        ...explicitGoals,
        `Likely growth direction around ${topSkills.join(' and ')} based on demonstrated capability signals.`
      ];
    }

    return explicitGoals.length > 0
      ? explicitGoals
      : ['Career aspirations have not yet been stated explicitly in this profile.'];
  }

  getPassionCards(): PassionCard[] {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    const workExperience = cv.workExperience ?? [];
    const topSkills = this.getTopSkills();
    const skillSeeds = [...topSkills, 'Systems Architecture', 'Coding', 'DevOps'];
    const uniqueTitles: string[] = [];

    for (const seed of skillSeeds) {
      const normalized = seed.trim();
      if (!normalized) {
        continue;
      }
      if (!uniqueTitles.some((value) => value.toLowerCase() === normalized.toLowerCase())) {
        uniqueTitles.push(normalized);
      }
      if (uniqueTitles.length === 3) {
        break;
      }
    }

    return uniqueTitles.map((title, index) => {
      const experienceMatch = this.findExperienceHighlight(workExperience, title, index);
      return {
        title,
        frontDescription: this.buildFrontCardDescription(title),
        backTitle: experienceMatch.jobTitle || 'Experience highlight',
        backDescription: `${experienceMatch.companyName}${experienceMatch.description ? ` - ${experienceMatch.description}` : ''}`
      };
    });
  }

  getWorkTimelineEvents(): WorkTimelineEvent[] {
    const cv = this.modalCv();
    if (!cv) {
      return [];
    }

    return [...cv.workExperience]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map((item) => ({
        title: item.jobTitle,
        company: item.companyName,
        location: item.location || 'Remote / Not specified',
        period: `${this.formatMonthYear(item.startDate)} - ${item.isCurrent ? 'Present' : this.formatMonthYear(item.endDate)}`,
        description: item.description || 'No role summary provided.',
        isCurrent: !!item.isCurrent
      }));
  }

  private extractAspirationGoalTitles(): string[] {
    const bio = this.modalCv()?.profile.biography ?? '';
    const separators = /[.;\n]/;
    const phrases = bio.split(separators)
      .map((item) => item.trim())
      .filter((item) => item.length >= 18)
      .slice(0, 2);
    return phrases;
  }

  private buildFrontCardDescription(title: string): string {
    return `Consistently engaged in ${title.toLowerCase()} work with practical delivery outcomes.`;
  }

  private formatMonthYear(dateValue: string | null): string {
    if (!dateValue) {
      return 'Unknown';
    }
    return new Date(dateValue).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  }

  private findExperienceHighlight(
    workExperience: PublicLivingCv['workExperience'],
    keyword: string,
    indexFallback: number
  ): PublicLivingCv['workExperience'][number] {
    const normalizedKeyword = keyword.toLowerCase();
    const match = workExperience.find((item) => {
      const job = (item.jobTitle ?? '').toLowerCase();
      const description = (item.description ?? '').toLowerCase();
      return job.includes(normalizedKeyword) || description.includes(normalizedKeyword);
    });

    if (match) {
      return match;
    }

    return workExperience[indexFallback] ?? workExperience[0] ?? {
      id: '',
      companyName: 'No company listed',
      jobTitle: 'No role listed',
      employmentType: null,
      startDate: new Date().toISOString(),
      endDate: null,
      isCurrent: false,
      location: null,
      description: 'No detailed work experience description available.',
      gapReason: null,
      includeInCv: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  setCvDetailTab(tab: CvDetailTab): void {
    this.activeCvDetailTab.set(tab);
  }

  hasCvDetailTabData(tab: CvDetailTab): boolean {
    const cv = this.modalCv();
    if (!cv) {
      return false;
    }

    switch (tab) {
      case 'SKILLS':
        return cv.skills.length > 0;
      case 'CERTIFICATIONS':
        return cv.certifications.length > 0;
      case 'REFERENCES':
        return cv.references.length > 0;
      case 'GROWTH':
        return true;
      default:
        return false;
    }
  }

  skillsByCategoryForModal(): { category: string; skills: CandidateSkill[] }[] {
    const cv = this.modalCv();
    const skills = cv?.skills ?? [];
    const map = new Map<string, CandidateSkill[]>();

    for (const skill of skills) {
      const category = skill.skillCategory?.trim() || 'General';
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category)!.push(skill);
    }

    const order = ['EXPERT', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'];
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, categorySkills]) => ({
        category,
        skills: [...categorySkills].sort(
          (a, b) => order.indexOf(a.proficiencyLevel?.toUpperCase()) - order.indexOf(b.proficiencyLevel?.toUpperCase())
        )
      }));
  }

  proficiencyPct(level: string): number {
    const map: Record<string, number> = {
      BEGINNER: 25,
      INTERMEDIATE: 55,
      ADVANCED: 80,
      EXPERT: 100
    };
    return map[level?.toUpperCase()] ?? 50;
  }

  proficiencyColor(level: string): string {
    const map: Record<string, string> = {
      EXPERT: '#0ea5e9',
      ADVANCED: '#10b981',
      INTERMEDIATE: '#f59e0b',
      BEGINNER: '#94a3b8'
    };
    return map[level?.toUpperCase()] ?? '#94a3b8';
  }

  formatSkillCategory(category: string | null): string {
    if (!category || !category.trim()) {
      return 'General';
    }

    return category
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
    this.watchFocusInput.set('');
    this.watchFocusAreas.set([]);
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

  updateWatchFocusInput(value: string): void {
    this.watchFocusInput.set(value);
  }

  addWatchFocusArea(): void {
    const input = this.watchFocusInput().trim();
    if (!input) {
      return;
    }

    const current = this.watchFocusAreas();
    if (current.length >= 3) {
      this.watchError.set('You can suggest up to 3 focus areas.');
      return;
    }

    if (current.some((area) => area.toLowerCase() === input.toLowerCase())) {
      this.watchFocusInput.set('');
      return;
    }

    this.watchFocusAreas.set([...current, input]);
    this.watchFocusInput.set('');
    this.watchError.set(null);
  }

  removeWatchFocusArea(index: number): void {
    this.watchFocusAreas.update((current) => current.filter((_, i) => i !== index));
    this.watchError.set(null);
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
      recruiterNote: this.watchNote().trim() || undefined,
      suggestedFocusAreas: this.watchFocusAreas().length > 0 ? this.watchFocusAreas() : undefined
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
    this.watchFocusInput.set('');
    this.watchFocusAreas.set([]);
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
    this.activeCvDetailTab.set('SKILLS');
    this.activeExecutiveStep.set('ABOUT');

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
    this.activeCvDetailTab.set('SKILLS');
    this.activeExecutiveStep.set('ABOUT');
  }
}
