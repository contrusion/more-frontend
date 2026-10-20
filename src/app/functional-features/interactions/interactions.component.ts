import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InteractionService } from './services/interaction.service';
import { EmailSyncService } from './services/email-sync.service';
import { InteractionThread, InteractionEvent, ThreadOpportunity, OpportunityFacts, ChannelType, EventType, InteractionStatus } from './models/interaction.model';
import { EmailThreadTimelineComponent } from './email-thread-timeline/email-thread-timeline.component';
import { InteractionThreadHeaderComponent } from './interaction-thread-header/interaction-thread-header.component';
import { ActivityTimelineStep, StageTimelineComponent } from './stage-timeline/stage-timeline.component';
import { ActivityGroup, resolveActivityGroup } from './utils/activity-group.util';
import { buildCandidateNotes, CandidateNote } from './utils/candidate-notes.util';
import { CandidateStage, getThreadSignalSet, isUnsuccessfulDecision, resolveCandidateStage } from './utils/thread-stage.util';
import { ScrollTopComponent } from '../../shared/components/scroll-top/scroll-top.component';

export type { CandidateStage };
export type CandidateConfidence = 'Low' | 'Medium' | 'High';

export interface CandidateInsightSummary {
  stage: CandidateStage;
  confidence: CandidateConfidence;
  activity: ActivityGroup;
  summary: string;
  nextUnlock: string;
  missingEvidence: string[];
  actions: string[];
}

export interface CandidateRiskItem {
  label: string;
  severity: CandidateConfidence | 'Low' | 'Medium' | 'High';
  summary: string;
  recommendation: string;
}

export interface CandidateFitRow {
  label: string;
  status: string;
  tone: 'success' | 'danger' | 'neutral';
  /** What the recruiter stated for this dimension, when known. */
  detail?: string;
}

type TimelineStageId = 'outreach' | 'screening' | 'interview' | 'offer' | 'unsuccessful' | 'closed';

interface TimelineStageDefinition {
  id: TimelineStageId;
  label: string;
  tone: ActivityGroup['tone'];
}

const BASE_TIMELINE_STAGES: readonly TimelineStageDefinition[] = [
  { id: 'outreach', label: 'Outreach', tone: 'neutral' },
  { id: 'screening', label: 'Screening', tone: 'info' },
  { id: 'interview', label: 'Interviews & Assessments', tone: 'success' },
  { id: 'closed', label: 'Closed', tone: 'neutral' }
];

const TIMELINE_OFFER_STAGE: TimelineStageDefinition = { id: 'offer', label: 'Offer stage', tone: 'info' };
const TIMELINE_UNSUCCESSFUL_STAGE: TimelineStageDefinition = { id: 'unsuccessful', label: 'Unsuccessful', tone: 'danger' };

@Component({
  selector: 'app-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatExpansionModule, MatButtonModule, EmailThreadTimelineComponent, InteractionThreadHeaderComponent, StageTimelineComponent, ScrollTopComponent],
  templateUrl: './interactions.component.html',
  styleUrls: ['./interactions.component.css']
})
export class InteractionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly timelineDensityStorageKey = 'more.interactions.timelineDensity';
  private readonly activityTimelineLimit = 6;
  private readonly activityTimelineCache = new WeakMap<InteractionThread, { key: string; value: { steps: ActivityTimelineStep[] } }>();
  
  threads: InteractionThread[] = [];
  filteredThreads: InteractionThread[] = [];
  selectedThread: InteractionThread | null = null;
  expandedThreadId: string | null = null;
  searchQuery: string = '';
  showInsightsPanel: boolean = true;
  isRefreshing: boolean = false;
  syncInProgress: boolean = false;
  syncFeedback: string | null = null;
  interactionMode: 'admin' | 'candidate' = 'candidate';
  timelineDensity: 'expanded' | 'compact' = 'expanded';
  
  // For new event
  showNewEventModal: boolean = false;
  newEventType: EventType = EventType.OUTREACH;
  newEventChannel: ChannelType = ChannelType.LINKEDIN;
  newEventContent: string = '';
  
  // For new thread creation
  showNewThreadModal: boolean = false;
  newThreadRecruiterName: string = '';
  newThreadCompany: string = '';
  newThreadJobTitle: string = '';
  newThreadEventType: EventType = EventType.OUTREACH;
  newThreadChannel: ChannelType = ChannelType.LINKEDIN;
  newThreadContent: string = '';
  
  // For add company modal
  showAddCompanyModal: boolean = false;
  selectedThreadForCompany: InteractionThread | null = null;
  newCompanyName: string = '';
  
  // Enums for template
  ChannelType = ChannelType;
  EventType = EventType;
  InteractionStatus = InteractionStatus;

  constructor(
    private interactionService: InteractionService,
    private emailSyncService: EmailSyncService
  ) {}

  ngOnInit(): void {
    this.timelineDensity = this.getStoredTimelineDensity();
    // Clear cache on app refresh to always get fresh data
    this.interactionService.clearCache();
    this.loadThreads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadThreads(): void {
    // Subscribe to cached threads observable
    this.interactionService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads => {
        this.threads = threads.sort((a, b) => 
          b.lastEventDate.getTime() - a.lastEventDate.getTime()
        );
        this.filteredThreads = [...this.threads];
        
        // Admin master-detail needs a selection; candidate accordion starts fully collapsed
        if (!this.selectedThread && this.threads.length > 0 && !this.isCandidateMode()) {
          this.selectThread(this.threads[0]);
        }
      });
    
    // Trigger initial load if not already loaded
    this.interactionService.getThreads().pipe(takeUntil(this.destroy$)).subscribe();
  }

  refreshThreads(): void {
    this.isRefreshing = true;
    this.interactionService.refreshThreads()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isRefreshing = false;
      });
  }

  isCandidateMode(): boolean {
    return this.interactionMode === 'candidate';
  }

  isAdminMode(): boolean {
    return this.interactionMode === 'admin';
  }

  getPageHeaderTitle(): string {
    return this.isCandidateMode() ? 'Recruiter Leads' : 'Interaction Events';
  }

  getCurrentCenterPanelMode(): 'timeline' | 'candidate-insights' {
    return this.isCandidateMode() ? 'candidate-insights' : 'timeline';
  }

  setInteractionMode(mode: 'admin' | 'candidate'): void {
    this.interactionMode = mode;
  }

  setAdminMode(): void {
    this.setInteractionMode('admin');
  }

  setCandidateMode(): void {
    this.setInteractionMode('candidate');
  }

  toggleTimelineDensity(): void {
    this.timelineDensity = this.timelineDensity === 'expanded' ? 'compact' : 'expanded';
    this.persistTimelineDensity(this.timelineDensity);
  }

  private getStoredTimelineDensity(): 'expanded' | 'compact' {
    try {
      const storedValue = sessionStorage.getItem(this.timelineDensityStorageKey);
      return storedValue === 'compact' ? 'compact' : 'expanded';
    } catch {
      return 'expanded';
    }
  }

  private persistTimelineDensity(density: 'expanded' | 'compact'): void {
    try {
      sessionStorage.setItem(this.timelineDensityStorageKey, density);
    } catch {
      // Ignore storage failures and keep the in-memory state as the source of truth.
    }
  }

  getCandidateStageSteps(): CandidateStage[] {
    return ['Contacted', 'Qualified', 'Interviewing', 'Decision'];
  }

  /**
   * Activity timeline: the thread's events are reduced into a stage pipeline.
   * The rail shows the current stage in the middle of the journey, with the next realistic steps ahead.
   * The result is cached per thread because the template binds it and a fresh array each check would
   * trip Angular's expression-changed check.
   */
  getActivityTimeline(thread: InteractionThread | null): { steps: ActivityTimelineStep[] } {
    if (!thread || thread.events.length === 0) {
      return { steps: [] };
    }

    const lastEvent = thread.events[thread.events.length - 1];
    const key = `${thread.events.length}|${lastEvent.id}|${new Date(lastEvent.timestamp).getTime()}`;
    const cached = this.activityTimelineCache.get(thread);
    if (cached?.key === key) {
      return cached.value;
    }

    const chronological = [...thread.events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const signals = this.getThreadSignalSet(thread);
    const currentStage = this.resolveTimelineStage(signals);
    const stagesToShow = this.getTimelineStages(currentStage, signals);

    const counts = new Map<TimelineStageId, number>();
    const firstSeen = new Map<TimelineStageId, Date>();
    for (const event of chronological) {
      const stageId = this.mapEventToTimelineStage(event.eventType, event.additionalEventTypes ?? []);
      counts.set(stageId, (counts.get(stageId) ?? 0) + 1);
      if (!firstSeen.has(stageId)) {
        firstSeen.set(stageId, new Date(event.timestamp));
      }
    }

    const currentIndex = stagesToShow.findIndex(stage => stage.id === currentStage);
    const resolvedCurrentIndex = currentIndex === -1 ? stagesToShow.length - 1 : currentIndex;

    const value = {
      steps: stagesToShow.map((stage, index) => ({
        label: stage.label,
        tone: stage.tone,
        reachedAt: index <= resolvedCurrentIndex
          ? firstSeen.get(stage.id) ?? (stage.id === 'closed' ? firstSeen.get('unsuccessful') : undefined)
          : undefined,
        count: counts.get(stage.id) ?? 0,
        state: (index < resolvedCurrentIndex ? 'past' : index === resolvedCurrentIndex ? 'current' : 'upcoming') as
          'past' | 'current' | 'upcoming',
        current: index === resolvedCurrentIndex
      }))
    };
    this.activityTimelineCache.set(thread, { key, value });
    return value;
  }

  private getTimelineStages(currentStage: TimelineStageId, signals: EventType[]): TimelineStageDefinition[] {
    const hasInterviewSignals = signals.some(type => [
      EventType.INTERVIEW_SCHEDULED,
      EventType.INTERVIEW_INVITE,
      EventType.INTERVIEW_TIME_ACCEPTED,
      EventType.INTERVIEW_TIME_PROPOSED,
      EventType.INTERVIEW_TIME_PROPOSED_REJECTED
    ].includes(type));

    const stages: TimelineStageDefinition[] = [...BASE_TIMELINE_STAGES.slice(0, 3)];

    if (hasInterviewSignals) {
      stages.push(TIMELINE_OFFER_STAGE);
    }

    if (currentStage === 'closed' && this.isUnsuccessfulDecision(signals)) {
      stages.push(TIMELINE_UNSUCCESSFUL_STAGE);
    }

    stages.push(BASE_TIMELINE_STAGES[3]);
    return stages;
  }

  private resolveTimelineStage(signals: EventType[]): TimelineStageId {
    const stage = this.resolveCandidateStage(signals);
    if (stage === 'Decision') {
      return 'closed';
    }

    if (stage === 'Interviewing') {
      return 'interview';
    }

    if (stage === 'Qualified') {
      return 'screening';
    }

    return 'outreach';
  }

  private mapEventToTimelineStage(eventType: EventType, additionalEventTypes: EventType[]): TimelineStageId {
    const signals = [eventType, ...additionalEventTypes];
    if (signals.some(type => [EventType.NOT_INTERESTED, EventType.REJECTION, EventType.SCREENING_ASSESSMENT_FAILED].includes(type))) {
      return 'unsuccessful';
    }

    if (signals.some(type => [
      EventType.INTERVIEW_SCHEDULED,
      EventType.INTERVIEW_INVITE,
      EventType.INTERVIEW_TIME_ACCEPTED,
      EventType.INTERVIEW_TIME_PROPOSED,
      EventType.INTERVIEW_TIME_PROPOSED_REJECTED
    ].includes(type))) {
      return 'interview';
    }

    if (signals.some(type => [
      EventType.CV_REQUEST,
      EventType.CV_SUBMITTED,
      EventType.JOB_SPEC_REQUEST,
      EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT,
      EventType.JOB_SPEC_ATTACHED,
      EventType.JOB_SPEC_REVIEWED,
      EventType.SCREENING_ASSESSMENT_REQUEST,
      EventType.SCREENING_ASSESSMENT_SCHEDULED,
      EventType.SCREENING_ASSESSMENT_COMPLETED,
      EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT,
      EventType.COMPENSATION_INQUIRY,
      EventType.COMPENSATION_NEEDS_MET,
      EventType.LOCATION_INQUIRY,
      EventType.LOCATION_NEEDS_MET,
      EventType.SKILLS_INQUIRY,
      EventType.VISA_INQUIRY,
      EventType.NOTICE_PERIOD_INQUIRY,
      EventType.AVAILABILITY_INQUIRY,
      EventType.BENEFITS_INQUIRY,
      EventType.INTERESTED,
      EventType.INTEREST_CHECK
    ].includes(type))) {
      return 'screening';
    }

    return 'outreach';
  }

  getOpportunityTitle(thread: InteractionThread | null): string {
    if (!thread) {
      return 'Recruiting for a role';
    }

    const opportunities = this.getDisplayOpportunities(thread);
    if (opportunities.length > 0) {
      const extra = opportunities.length - 1;
      const headline = this.formatOpportunityHeadline(opportunities[0]);
      return extra > 0 ? `${headline} +${extra} more` : headline;
    }

    const role = this.normalizeOpportunityValue(thread.jobTitle);
    return role ? `Recruiting for a ${role}` : 'Recruiting for a role';
  }

  getAdditionalOpportunityLabels(thread: InteractionThread | null): string[] {
    if (!thread) {
      return [];
    }

    return this.getDisplayOpportunities(thread)
      .slice(1)
      .map(opportunity => this.formatOpportunity(opportunity));
  }

  /** Heading for the expanded overview: the most recently mentioned client opportunity. */
  getOpportunityHeading(thread: InteractionThread | null): string {
    const primary = thread ? this.getDisplayOpportunities(thread)[0] : undefined;
    const company = this.normalizeOpportunityValue(primary?.companyName) ?? 'Opportunity';
    const role = this.normalizeOpportunityValue(primary?.title ?? thread?.jobTitle) ?? 'Role conversation';
    return `${company} · ${role}`;
  }

  private formatOpportunityHeadline(opportunity: ThreadOpportunity): string {
    const company = this.normalizeOpportunityValue(opportunity.companyName);
    const role = this.normalizeOpportunityValue(opportunity.title);

    if (company && role) {
      return `Recruiting for ${role} at ${company}`;
    }

    if (company) {
      return `Recruiting at ${company}`;
    }

    return role ? `Recruiting for ${role}` : 'Recruiting for a role';
  }

  private formatOpportunity(opportunity: ThreadOpportunity): string {
    const role = this.normalizeOpportunityValue(opportunity.title);
    const company = this.normalizeOpportunityValue(opportunity.companyName);

    if (company) {
      return `${role ?? 'Role'} at ${company}`;
    }

    return role ?? 'Recruiting for a role';
  }

  /** Website of the client the candidate would be placed at; never the recruiter's own company. */
  getCompanyWebsiteUrl(thread: InteractionThread | null): string | null {
    const website = thread ? this.getDisplayOpportunities(thread)[0]?.companyWebsite : undefined;
    return website?.trim() || null;
  }

  private getDisplayOpportunities(thread: InteractionThread): ThreadOpportunity[] {
    const recruiterCompany = this.normalizedCompanyKey(thread.companyName);
    const seen = new Set<string>();
    const opportunities = (thread.opportunities ?? [])
      .filter(opportunity => this.hasOpportunityContext(opportunity))
      .filter(opportunity => {
        const company = this.normalizedCompanyKey(opportunity.companyName);
        return !company || company !== recruiterCompany;
      })
      .filter(opportunity => {
        const key = this.opportunityIdentity(opportunity);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

    // Collapse only untitled duplicates per company; preserve distinct titled roles.
    const collapsed: ThreadOpportunity[] = [];

    for (const opportunity of opportunities) {
      const companyKey = this.normalizedCompanyKey(opportunity.companyName);
      const role = this.normalizeOpportunityValue(opportunity.title);

      if (!companyKey) {
        collapsed.push(opportunity);
        continue;
      }

      const sameCompanyIndices = collapsed
        .map((existing, index) => ({ existing, index }))
        .filter(item => this.normalizedCompanyKey(item.existing.companyName) === companyKey);

      if (role) {
        const untitled = sameCompanyIndices.find(item => !this.normalizeOpportunityValue(item.existing.title));
        if (untitled) {
          collapsed[untitled.index] = opportunity;
          continue;
        }

        collapsed.push(opportunity);
        continue;
      }

      const hasAnySameCompany = sameCompanyIndices.length > 0;
      if (!hasAnySameCompany) {
        collapsed.push(opportunity);
      }
    }

    return collapsed.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  private opportunityIdentity(opportunity: ThreadOpportunity): string {
    return `${this.normalizedCompanyKey(opportunity.companyName)}|${this.normalizedTitleKey(opportunity.title)}`;
  }

  private hasOpportunityContext(opportunity: ThreadOpportunity): boolean {
    return !!this.normalizeOpportunityValue(opportunity.title) || !!this.normalizeOpportunityValue(opportunity.companyName);
  }

  private normalizedCompanyKey(value: string | undefined): string {
    return this.normalizeOpportunityValue(value)?.toLowerCase() ?? '';
  }

  private normalizedTitleKey(value: string | undefined): string {
    return this.normalizeOpportunityValue(value)?.toLowerCase() ?? '';
  }

  private normalizeOpportunityValue(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase() === 'missing' || normalized.toLowerCase() === '(missing)' || normalized.toLowerCase() === 'unknown') {
      return undefined;
    }

    return normalized;
  }

  getDealBreakerCount(thread: InteractionThread | null): number {
    if (!thread) {
      return 0;
    }

    return this.getCandidateRiskItems(thread).length;
  }

  hasAnyEventType(thread: InteractionThread | null, eventTypes: EventType[]): boolean {
    if (!thread) {
      return false;
    }

    return thread.events.some(event => eventTypes.includes(event.eventType));
  }

  getRoleFitStatus(thread: InteractionThread | null): 'Ready' | 'Needs review' {
    return this.hasAnyEventType(thread, [EventType.JOB_SPEC_REVIEWED, EventType.JOB_SPEC_ATTACHED]) ? 'Ready' : 'Needs review';
  }

  getLocationFitStatus(thread: InteractionThread | null): 'Aligned' | 'At risk' | 'Pending' {
    if (this.hasAnyEventType(thread, [EventType.LOCATION_NEEDS_MET])) {
      return 'Aligned';
    }

    if (this.hasAnyEventType(thread, [EventType.LOCATION_BOTTLENECK])) {
      return 'At risk';
    }

    return 'Pending';
  }

  getCompensationFitStatus(thread: InteractionThread | null): 'Aligned' | 'At risk' | 'Pending' {
    if (this.hasAnyEventType(thread, [EventType.COMPENSATION_NEEDS_MET])) {
      return 'Aligned';
    }

    if (this.hasAnyEventType(thread, [EventType.COMPENSATION_BOTTLENECK])) {
      return 'At risk';
    }

    return 'Pending';
  }

  getTimingFitStatus(thread: InteractionThread | null): 'Confirmed' | 'Pending' {
    return this.hasAnyEventType(thread, [EventType.INTERVIEW_TIME_ACCEPTED, EventType.INTERVIEW_SCHEDULED]) ? 'Confirmed' : 'Pending';
  }

  /** Fit status per dimension, paired with what the recruiter stated, for the opportunity overview. */
  getFitRows(thread: InteractionThread | null): CandidateFitRow[] {
    if (!thread) {
      return [];
    }

    const facts = (thread.opportunities ?? []).map(opportunity => opportunity.facts);
    const stated = (pick: (fact: OpportunityFacts) => string | undefined) =>
      facts.map(pick).map(value => value?.trim()).find((value): value is string => !!value);

    const skills = [...new Set(facts.flatMap(fact => fact.skills.map(skill => skill.trim()).filter(Boolean)))];
    const skillsDetail = skills.length > 4 ? `${skills.slice(0, 4).join(', ')} +${skills.length - 4}` : skills.join(', ');
    const mode = stated(fact => fact.workMode);
    const location = stated(fact => fact.location);
    const roleFit = this.getRoleFitStatus(thread);
    const locationFit = this.getLocationFitStatus(thread);
    const compensationFit = this.getCompensationFitStatus(thread);
    const timingFit = this.getTimingFitStatus(thread);
    const fitTone = (status: string): CandidateFitRow['tone'] =>
      ['Ready', 'Aligned', 'Confirmed'].includes(status) ? 'success' : status === 'At risk' ? 'danger' : 'neutral';

    return [
      { label: 'Role', status: roleFit, tone: fitTone(roleFit), detail: skillsDetail || undefined },
      { label: 'Location', status: locationFit, tone: fitTone(locationFit), detail: [mode, location].filter(Boolean).join(', ') || undefined },
      { label: 'Compensation', status: compensationFit, tone: fitTone(compensationFit), detail: stated(fact => fact.salary) },
      { label: 'Timing', status: timingFit, tone: fitTone(timingFit), detail: stated(fact => fact.interviewDate) }
    ];
  }

  /** Deal breakers stated in the emails, deduplicated across the thread's opportunities. */
  getDealBreakerLabels(thread: InteractionThread | null): string[] {
    return thread ? this.getOpportunityDealBreakerRisks(thread).map(risk => risk.summary) : [];
  }

  getCandidateInsightSummary(thread: InteractionThread | null): CandidateInsightSummary | null {
    if (!thread) {
      return null;
    }

    const signals = this.getThreadSignalSet(thread);
    const stage = this.resolveCandidateStage(signals);
    const confidence = this.resolveCandidateConfidence(stage, signals);
    const activity = this.getThreadActivityGroup(thread);
    const nextUnlock = this.getCandidateNextUnlock(stage, signals);
    const actions = this.getCandidateActionPlan(thread, stage, signals);
    const missingEvidence = this.getCandidateMissingEvidence(stage, signals);

    const summary = this.buildCandidateSummary(thread, stage, signals);

    return {
      stage,
      confidence,
      activity,
      summary,
      nextUnlock,
      missingEvidence,
      actions
    };
  }

  /** Items worth noting for the current stage and for stages still to come. */
  getCandidateNotes(thread: InteractionThread | null): CandidateNote[] {
    if (!thread) {
      return [];
    }

    const signals = this.getThreadSignalSet(thread);
    return buildCandidateNotes({
      stage: this.resolveCandidateStage(signals),
      signals,
      facts: (thread.opportunities ?? []).map(opportunity => opportunity.facts),
      daysSinceLastEvent: this.getDaysSinceLastEventForThread(thread),
      now: new Date(),
      unsuccessful: this.isUnsuccessfulDecision(signals)
    });
  }

  getCandidateRiskItems(thread: InteractionThread | null): CandidateRiskItem[] {
    if (!thread) {
      return [];
    }

    const signals = this.getThreadSignalSet(thread);
    const risks: CandidateRiskItem[] = [];
    const daysSinceLastEvent = this.getDaysSinceLastEventForThread(thread);

    if (signals.includes(EventType.LOCATION_BOTTLENECK)) {
      risks.push({
        label: 'Location risk',
        severity: 'High',
        summary: 'Location constraints are still blocking agreement.',
        recommendation: 'Clarify if remote or hybrid flexibility is possible before the next step.'
      });
    }

    if (signals.includes(EventType.COMPENSATION_BOTTLENECK)) {
      risks.push({
        label: 'Compensation risk',
        severity: 'High',
        summary: 'Compensation expectations are not aligned yet.',
        recommendation: 'Confirm a realistic range and decide whether to continue or defer.'
      });
    }

    if (signals.includes(EventType.SCREENING_ASSESSMENT_FAILED)) {
      risks.push({
        label: 'Screening risk',
        severity: 'High',
        summary: 'The screening assessment outcome may still be blocking progress.',
        recommendation: 'Ask for feedback and decide whether a re-test or alternative path is viable.'
      });
    }

    if (signals.includes(EventType.INTERVIEW_TIME_PROPOSED_REJECTED)) {
      risks.push({
        label: 'Interview timing friction',
        severity: 'Medium',
        summary: 'Interview timing has not been aligned yet.',
        recommendation: 'Offer a few concrete alternatives and keep the scheduling path moving.'
      });
    }

    if (daysSinceLastEvent > 7) {
      risks.push({
        label: 'Process delay',
        severity: 'Medium',
        summary: 'There has been no meaningful progression for more than a week.',
        recommendation: 'Send a concise follow-up and re-confirm the next commitment point.'
      });
    }

    return [...this.getOpportunityDealBreakerRisks(thread), ...risks.slice(0, 3)];
  }

  /** Deal breakers stated in the emails, deduplicated across the thread's opportunities. */
  private getOpportunityDealBreakerRisks(thread: InteractionThread): CandidateRiskItem[] {
    const seen = new Set<string>();
    const risks: CandidateRiskItem[] = [];

    for (const opportunity of thread.opportunities ?? []) {
      for (const dealBreaker of opportunity.facts.dealBreakers) {
        const key = dealBreaker.trim().toLowerCase();
        if (!key || seen.has(key)) {
          continue;
        }
        seen.add(key);
        risks.push({
          label: 'Deal breaker',
          severity: 'High',
          summary: dealBreaker.trim(),
          recommendation: 'Confirm this works for you before investing more time in this role.'
        });
      }
    }

    return risks;
  }

  triggerEmailSync(): void {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.syncFeedback = 'Syncing recruiter emails...';

    this.emailSyncService.syncNow()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.syncInProgress = false;
          this.syncFeedback = result.success && result.processed > 0
            ? `${result.processed} new interaction${result.processed === 1 ? '' : 's'} imported`
            : 'Email sync completed without new interactions';
          this.refreshThreads();
        },
        error: () => {
          this.syncInProgress = false;
          this.syncFeedback = 'Email sync failed. Please try again.';
        }
      });
  }

  selectThread(thread: InteractionThread): void {
    this.selectedThread = thread;
    this.expandedThreadId = thread.id;
    if (thread.unreadCount > 0) {
      this.interactionService.markAsRead(thread.id).subscribe();
    }
  }

  onThreadPanelOpened(thread: InteractionThread): void {
    if (this.expandedThreadId !== thread.id || this.selectedThread?.id !== thread.id) {
      this.selectThread(thread);
    }
  }

  onThreadPanelClosed(thread: InteractionThread): void {
    if (this.expandedThreadId === thread.id) {
      this.expandedThreadId = null;
    }
  }

  getSelectedThreadIds(): string[] {
    if (!this.selectedThread) {
      return [];
    }

    return [...new Set(this.selectedThread.events
      .map(event => event.threadId)
      .filter((threadId): threadId is string => Boolean(threadId)))];
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredThreads = [...this.threads];
      return;
    }
    
    this.filteredThreads = this.threads.filter(thread =>
      thread.participantName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      thread.jobTitle?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      thread.companyName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openNewEventModal(): void {
    this.showNewEventModal = true;
  }

  closeNewEventModal(): void {
    this.showNewEventModal = false;
    this.newEventType = EventType.OUTREACH;
    this.newEventChannel = ChannelType.LINKEDIN;
    this.newEventContent = '';
  }

  openNewThreadModal(): void {
    this.showNewThreadModal = true;
  }

  closeNewThreadModal(): void {
    this.showNewThreadModal = false;
    this.newThreadRecruiterName = '';
    this.newThreadCompany = '';
    this.newThreadJobTitle = '';
    this.newThreadEventType = EventType.OUTREACH;
    this.newThreadChannel = ChannelType.LINKEDIN;
    this.newThreadContent = '';
  }

  createNewThread(): void {
    if (!this.newThreadRecruiterName.trim() || !this.newThreadContent.trim()) {
      alert('Recruiter name and initial message are required');
      return;
    }

    // TODO: Replace with actual API call to create new thread
    const newThread: InteractionThread = {
      id: Math.random().toString(36).substr(2, 9),
      participantId: 'recruiter-' + Math.random().toString(36).substr(2, 9),
      participantName: this.newThreadRecruiterName,
      participantRole: 'RECRUITER',
      companyName: this.newThreadCompany || undefined,
      jobTitle: this.newThreadJobTitle || undefined,
      status: InteractionStatus.NEW,
      lastEventDate: new Date(),
      lastEventPreview: this.newThreadContent.substring(0, 100),
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [
        {
          id: Math.random().toString(36).substr(2, 9),
          interactionThreadId: '',
          eventType: this.newThreadEventType,
          channel: this.newThreadChannel,
          content: this.newThreadContent,
          timestamp: new Date(),
          senderId: 'current-user',
          senderName: 'You'
        }
      ]
    };

    // Add to local threads array (TODO: call backend API)
    this.threads.unshift(newThread);
    this.filteredThreads = [...this.threads];
    
    // Select the newly created thread
    this.selectThread(newThread);
    
    this.closeNewThreadModal();
  }

  logEvent(): void {
    if (!this.newEventContent.trim() || !this.selectedThread) return;

    const request = {
      interactionThreadId: this.selectedThread.id,
      eventType: this.newEventType,
      channel: this.newEventChannel,
      content: this.newEventContent
    };

    this.interactionService.createEvent(request).subscribe(event => {
      this.selectedThread!.events.push(event);
      this.selectedThread!.lastEventDate = event.timestamp;
      this.selectedThread!.lastEventPreview = event.content;
      this.closeNewEventModal();
      
      // Refresh threads to get latest data from backend
      this.refreshThreads();
    });
  }

  getChannelIcon(channel: ChannelType): string {
    const icons: { [key in ChannelType]: string } = {
      [ChannelType.MO_NATIVE]: 'chat',
      [ChannelType.EMAIL]: 'email',
      [ChannelType.LINKEDIN]: 'linkedin',
      [ChannelType.PHONE]: 'phone',
      [ChannelType.WHATSAPP]: 'whatsapp',
      [ChannelType.IN_PERSON]: 'users',
      [ChannelType.VIDEO_CALL]: 'video',
      [ChannelType.TEXT_MESSAGE]: 'message',
      [ChannelType.OTHER]: 'dots'
    };
    return icons[channel];
  }

  getChannelColor(channel: ChannelType): string {
    const colors: { [key in ChannelType]: string } = {
      [ChannelType.MO_NATIVE]: '#0ea5e9',
      [ChannelType.EMAIL]: '#ea4335',
      [ChannelType.LINKEDIN]: '#0077b5',
      [ChannelType.PHONE]: '#6366f1',
      [ChannelType.WHATSAPP]: '#25d366',
      [ChannelType.IN_PERSON]: '#8b5cf6',
      [ChannelType.VIDEO_CALL]: '#ec4899',
      [ChannelType.TEXT_MESSAGE]: '#10b981',
      [ChannelType.OTHER]: '#6b7280'
    };
    return colors[channel];
  }

  getStatusBadgeClass(status: InteractionStatus): string {
    const classes: { [key in InteractionStatus]: string } = {
      [InteractionStatus.NEW]: 'badge-info',
      [InteractionStatus.ACTIVE]: 'badge-success',
      [InteractionStatus.STALE]: 'badge-warning',
      [InteractionStatus.CLOSED]: 'badge-gray'
    };
    return classes[status];
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getThreadStatusSummary(thread: InteractionThread): string {
    const lastEvent = thread.events[thread.events.length - 1];
    if (!lastEvent) {
      return thread.lastEventPreview || 'No activity yet';
    }

    const fromUser = lastEvent.senderId === 'current-user';

    switch (lastEvent.eventType) {
      case EventType.CV_REQUEST:
        return fromUser ? 'You requested a CV update' : 'They are waiting for you to send CV';
      case EventType.CV_SUBMITTED:
        return fromUser ? 'You sent your CV' : 'They shared a CV with you';
      case EventType.SCREENING_ASSESSMENT_REQUEST:
        return fromUser ? 'You requested a screening assessment' : 'They asked you to complete a screening assessment';
      case EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT:
        return fromUser ? 'You acknowledged the screening assessment completion' : 'They acknowledged the screening assessment completion';
      case EventType.SCREENING_ASSESSMENT_SCHEDULED:
        return fromUser ? 'You scheduled the screening assessment' : 'They scheduled the screening assessment';
      case EventType.SCREENING_ASSESSMENT_COMPLETED:
        return fromUser ? 'You completed the screening assessment' : 'They completed the screening assessment';
      case EventType.SCREENING_ASSESSMENT_PASSED:
        return fromUser ? 'You confirmed the screening was passed' : 'They confirmed you passed the screening';
      case EventType.SCREENING_ASSESSMENT_FAILED:
        return fromUser ? 'You flagged a failed screening assessment' : 'They flagged a failed screening assessment';
      case EventType.INTERVIEW_TIME_PROPOSED:
        return fromUser ? 'You proposed an interview time' : 'They proposed an interview time';
      case EventType.INTERVIEW_TIME_PROPOSED_REJECTED:
        return fromUser ? 'You declined the proposed interview time' : 'They declined your proposed interview time';
      case EventType.INTERVIEW_TIME_ACCEPTED:
        return fromUser ? 'You accepted the interview time' : 'They accepted the interview time';
      case EventType.INTERVIEW_SCHEDULED:
        return fromUser ? 'You scheduled the interview' : 'They scheduled the interview';
      case EventType.INTERVIEW_INVITE:
        return fromUser ? 'You proposed an interview time' : 'They invited you to interview';
      case EventType.JOB_SPEC_REQUEST:
        return fromUser ? 'You requested the job spec' : 'They requested the job spec';
      case EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT:
        return fromUser ? 'You wrote the job spec details in the email' : 'They wrote the job spec details in the email';
      case EventType.JOB_SPEC_REVIEWED:
        return fromUser ? 'You reviewed the job spec' : 'They reviewed the job spec';
      case EventType.JOB_SPEC_TO_BE_SENT:
        return fromUser ? 'You will send role details if needed' : 'They will send the job spec if you need it';
      case EventType.JOB_SPEC_ATTACHED:
        return fromUser ? 'You sent role details' : 'They sent you the job spec';
      case EventType.SKILLS_INQUIRY:
        return fromUser ? 'You asked about required skills' : 'They asked about your skills';
      case EventType.SKILLS_GAP:
        return fromUser ? 'You shared a skills gap concern' : 'They flagged a skills gap concern';
      case EventType.COMPENSATION_INQUIRY:
        return fromUser ? 'You asked about compensation' : 'They asked about your compensation expectations';
      case EventType.COMPENSATION_BOTTLENECK:
        return fromUser ? 'You flagged a compensation bottleneck' : 'They flagged a compensation bottleneck';
      case EventType.COMPENSATION_NEEDS_MET:
        return fromUser ? 'You confirmed compensation expectations are met' : 'They confirmed compensation expectations are met';
      case EventType.LOCATION_INQUIRY:
        return fromUser ? 'You asked about location setup' : 'They asked about your location preference';
      case EventType.LOCATION_BOTTLENECK:
        return fromUser ? 'You flagged a location bottleneck' : 'They flagged a location bottleneck';
      case EventType.LOCATION_NEEDS_MET:
        return fromUser ? 'You confirmed location needs are met' : 'They confirmed your location needs are met';
      case EventType.RECRUITEMENT_PROCESS_UPDATE:
        return fromUser ? 'You shared a recruitment process update' : 'They shared a recruitment process update';
      case EventType.NOTICE_PERIOD_INQUIRY:
        return fromUser ? 'You asked about notice period' : 'They asked about your notice period';
      case EventType.AVAILABILITY_INQUIRY:
        return fromUser ? 'You asked about availability' : 'They asked about your availability';
      case EventType.VISA_INQUIRY:
        return fromUser ? 'You asked about visa support' : 'They asked about visa or sponsorship status';
      case EventType.BENEFITS_INQUIRY:
        return fromUser ? 'You asked about benefits' : 'They asked about benefits expectations';
      case EventType.INQUIRY:
        if (fromUser) {
          return 'You sent a hiring-related question';
        }
        return this.buildInquiryWaitingSummary(lastEvent.additionalEventTypes || []);
      case EventType.INTERESTED:
        return fromUser ? 'You confirmed interest in the role' : 'They confirmed interest to continue';
      case EventType.INTEREST_CHECK:
        return fromUser ? 'You asked if they are interested' : 'They are asking if you are interested';
      case EventType.ACKNOWLEDGEMENT:
        return fromUser ? 'You acknowledged their message' : 'They acknowledged your message';
      case EventType.NOT_INTERESTED:
        return fromUser ? 'You declined this opportunity' : 'They are no longer proceeding';
      case EventType.REJECTION:
        return fromUser ? 'You closed this opportunity' : 'They shared an unsuccessful outcome';
      case EventType.FOLLOW_UP:
        return fromUser ? 'You followed up for an update' : 'They followed up and are waiting for your response';
      case EventType.REPLY:
        return fromUser ? 'You replied and they may respond next' : 'They replied and are waiting for your response';
      case EventType.OUTREACH:
        return fromUser ? 'You initiated the conversation' : 'New recruiter outreach needs your response';
      case EventType.PENDING_CLASSIFICATION:
      case EventType.UNKNOWN:
        return 'Not Classified';
      default:
        return thread.lastEventPreview || 'Latest status updated';
    }
  }

  private buildInquiryWaitingSummary(additionalTypes: EventType[]): string {
    const inquiryOrder: EventType[] = [
      EventType.LOCATION_INQUIRY,
      EventType.COMPENSATION_INQUIRY,
      EventType.SKILLS_INQUIRY,
      EventType.NOTICE_PERIOD_INQUIRY,
      EventType.AVAILABILITY_INQUIRY,
      EventType.VISA_INQUIRY,
      EventType.BENEFITS_INQUIRY
    ];

    const labels: Record<EventType, string> = {
      [EventType.LOCATION_INQUIRY]: 'location',
      [EventType.LOCATION_BOTTLENECK]: 'location bottleneck',
      [EventType.COMPENSATION_INQUIRY]: 'salary',
      [EventType.COMPENSATION_BOTTLENECK]: 'compensation bottleneck',
      [EventType.NOTICE_PERIOD_INQUIRY]: 'notice period',
      [EventType.AVAILABILITY_INQUIRY]: 'availability',
      [EventType.VISA_INQUIRY]: 'visa status',
      [EventType.BENEFITS_INQUIRY]: 'benefits expectations',
      [EventType.OUTREACH]: 'outreach',
      [EventType.REPLY]: 'reply',
      [EventType.FOLLOW_UP]: 'follow up',
      [EventType.CV_REQUEST]: 'CV',
      [EventType.CV_SUBMITTED]: 'CV',
      [EventType.SCREENING_ASSESSMENT_REQUEST]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT]: 'screening assessment acknowledgement',
      [EventType.SCREENING_ASSESSMENT_SCHEDULED]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_COMPLETED]: 'screening assessment',
      [EventType.SCREENING_ASSESSMENT_PASSED]: 'screening assessment outcome',
      [EventType.SCREENING_ASSESSMENT_FAILED]: 'screening assessment outcome',
      [EventType.INTERVIEW_TIME_PROPOSED]: 'interview time',
      [EventType.INTERVIEW_TIME_PROPOSED_REJECTED]: 'interview time proposal',
      [EventType.INTERVIEW_TIME_ACCEPTED]: 'interview time',
      [EventType.INTERVIEW_SCHEDULED]: 'interview schedule',
      [EventType.INTERVIEW_INVITE]: 'interview availability',
      [EventType.JOB_SPEC_REQUEST]: 'job spec',
      [EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT]: 'job spec',
      [EventType.JOB_SPEC_REVIEWED]: 'job spec review',
      [EventType.JOB_SPEC_TO_BE_SENT]: 'role details',
      [EventType.JOB_SPEC_ATTACHED]: 'role details',
      [EventType.INQUIRY]: 'screening details',
      [EventType.SKILLS_INQUIRY]: 'skills',
      [EventType.SKILLS_GAP]: 'skills gap',
      [EventType.COMPENSATION_NEEDS_MET]: 'compensation alignment',
      [EventType.LOCATION_NEEDS_MET]: 'location alignment',
      [EventType.INTERESTED]: 'interest confirmation',
      [EventType.INTEREST_CHECK]: 'interest confirmation',
      [EventType.ACKNOWLEDGEMENT]: 'acknowledgement',
      [EventType.NOT_INTERESTED]: 'interest decision',
      [EventType.REJECTION]: 'decision outcome',
      [EventType.RECRUITEMENT_PROCESS_UPDATE]: 'process update',
      [EventType.PENDING_CLASSIFICATION]: 'classification',
      [EventType.UNKNOWN]: 'classification'
    };

    const ordered = inquiryOrder
      .filter(type => additionalTypes.includes(type))
      .map(type => labels[type]);

    if (ordered.length === 0) {
      return 'They are waiting on your answers to screening questions';
    }

    if (ordered.length === 1) {
      return `They are waiting for your ${ordered[0]} details`;
    }

    if (ordered.length === 2) {
      return `They are waiting for your ${ordered[0]} and ${ordered[1]} details`;
    }

    const head = ordered.slice(0, ordered.length - 1).join(', ');
    const tail = ordered[ordered.length - 1];
    return `They are waiting for your ${head}, and ${tail} details`;
  }

  addCompany(thread: InteractionThread): void {
    this.selectedThreadForCompany = thread;
    this.newCompanyName = '';
    this.showAddCompanyModal = true;
  }

  confirmAddCompany(): void {
    if (!this.newCompanyName.trim() || !this.selectedThreadForCompany) return;

    // TODO: Call backend API to update the interaction with company name
    this.selectedThreadForCompany.companyName = this.newCompanyName.trim();
    console.log(`Company "${this.newCompanyName}" added for ${this.selectedThreadForCompany.participantName}`);
    
    this.cancelAddCompany();
  }

  cancelAddCompany(): void {
    this.showAddCompanyModal = false;
    this.selectedThreadForCompany = null;
    this.newCompanyName = '';
  }

  // ========== INSIGHTS & ANALYTICS ==========
  
  toggleInsightsPanel(): void {
    this.showInsightsPanel = !this.showInsightsPanel;
  }

  getRecruiterResponseRate(thread: InteractionThread | null = this.selectedThread): number {
    if (!thread) return 0;
    const recruiterEvents = thread.events.filter(e => e.senderId !== 'current-user');
    const userEvents = thread.events.filter(e => e.senderId === 'current-user');
    if (userEvents.length === 0) return 0;
    return Math.round((recruiterEvents.length / userEvents.length) * 100);
  }

  getAverageResponseTime(thread: InteractionThread | null = this.selectedThread): string {
    if (!thread || thread.events.length < 2) return 'N/A';

    let totalHours = 0;
    let responseCount = 0;

    for (let i = 1; i < thread.events.length; i++) {
      const current = new Date(thread.events[i].timestamp);
      const previous = new Date(thread.events[i - 1].timestamp);
      const diffHours = (current.getTime() - previous.getTime()) / (1000 * 60 * 60);
      totalHours += diffHours;
      responseCount++;
    }

    const avgHours = totalHours / responseCount;
    if (avgHours < 1) return `${Math.round(avgHours * 60)} mins`;
    if (avgHours < 24) return `${Math.round(avgHours)} hours`;
    return `${Math.round(avgHours / 24)} days`;
  }

  getInteractionAge(thread: InteractionThread | null = this.selectedThread): number {
    if (!thread) return 0;
    const ageMs = Date.now() - new Date(thread.createdAt).getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  getDaysSinceLastEvent(thread: InteractionThread | null = this.selectedThread): number {
    if (!thread) return 0;
    const diffMs = Date.now() - new Date(thread.lastEventDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private getDaysSinceLastEventForThread(thread: InteractionThread): number {
    const diffMs = Date.now() - new Date(thread.lastEventDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  isThreadUpdateStale(thread: InteractionThread): boolean {
    return this.getDaysSinceLastEventForThread(thread) > 7;
  }

  /** Status group of the newest event (primary plus additional signals), regardless of age. */
  getThreadActivityGroup(thread: InteractionThread): ActivityGroup {
    const lastEvent = thread.events[thread.events.length - 1];
    return resolveActivityGroup([lastEvent?.eventType, ...(lastEvent?.additionalEventTypes ?? [])]);
  }

  getThreadStageLabel(thread: InteractionThread): string {
    const currentStep = this.getActivityTimeline(thread).steps.find(step => step.current);
    return currentStep?.label ?? 'Outreach';
  }

  getThreadStageClass(thread: InteractionThread): string {
    const currentStep = this.getActivityTimeline(thread).steps.find(step => step.current);
    return `activity-${currentStep?.tone ?? 'neutral'}`;
  }

  private isUnsuccessfulDecision(signals: EventType[]): boolean {
    return isUnsuccessfulDecision(signals);
  }

  private getThreadSignalSet(thread: InteractionThread): EventType[] {
    return getThreadSignalSet(thread);
  }

  private resolveCandidateStage(signals: EventType[]): CandidateStage {
    return resolveCandidateStage(signals);
  }

  private resolveCandidateConfidence(stage: CandidateStage, signals: EventType[]): CandidateConfidence {
    const strongSignals = [
      EventType.SCREENING_ASSESSMENT_PASSED,
      EventType.INTERVIEW_TIME_ACCEPTED,
      EventType.INTERVIEW_SCHEDULED,
      EventType.JOB_SPEC_REVIEWED,
      EventType.CV_SUBMITTED,
      EventType.INTERESTED,
      EventType.LOCATION_NEEDS_MET,
      EventType.COMPENSATION_NEEDS_MET
    ];

    const weakSignals = [
      EventType.OUTREACH,
      EventType.REPLY,
      EventType.FOLLOW_UP,
      EventType.ACKNOWLEDGEMENT,
      EventType.INTEREST_CHECK
    ];

    const score = signals.reduce((total, signal) => {
      if (strongSignals.includes(signal)) {
        return total + 2;
      }
      if (weakSignals.includes(signal)) {
        return total + 1;
      }
      return total;
    }, 0);

    if (stage === 'Decision' || score >= 4) {
      return 'High';
    }
    if (stage === 'Interviewing' || score >= 2) {
      return 'Medium';
    }
    return 'Low';
  }

  private buildCandidateSummary(thread: InteractionThread, stage: CandidateStage, signals: EventType[]): string {
    const roleLabel = thread.jobTitle || 'this opportunity';
    const companyLabel = thread.companyName || 'the company';

    if (stage === 'Decision') {
      return `You are currently in the decision phase for ${roleLabel} at ${companyLabel}. The latest signals indicate the process is closing or being re-evaluated, and the most important next move is to confirm whether you want to continue or step away.`;
    }

    if (stage === 'Interviewing') {
      return `You are in the interview stage for ${roleLabel} at ${companyLabel}. The latest flow points toward scheduling or follow-up, so clarity on timing and logistics matters most.`;
    }

    if (stage === 'Qualified') {
      return `You are qualified for ${roleLabel} at ${companyLabel}. The thread has strong fit signals, so reinforcing the next step with a precise reply is the best move now.`;
    }

    if (signals.includes(EventType.OUTREACH) || signals.includes(EventType.REPLY)) {
      return `You are in the early outreach phase for ${roleLabel} at ${companyLabel}. The conversation is still forming, and a clear response or role detail request will keep it moving.`;
    }

    return `You are in the early stages of ${roleLabel} at ${companyLabel}. The conversation is active, but the next step is to improve clarity around the role and your fit.`;
  }

  private getCandidateNextUnlock(stage: CandidateStage, signals: EventType[]): string {
    if (stage === 'Contacted') {
      return 'Ask for the role summary, confirm interest, and move toward a clearer fit conversation.';
    }
    if (stage === 'Qualified') {
      if (signals.includes(EventType.JOB_SPEC_REQUEST) || signals.includes(EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT) || signals.includes(EventType.JOB_SPEC_ATTACHED)) {
        return 'Confirm the role fit and resolve any remaining location, compensation, or skills questions.';
      }
      return 'Share a concise fit summary and request the next hiring step or screening detail.';
    }
    if (stage === 'Interviewing') {
      return 'Confim early interview timing and prepare with a short talent summary and clear availability.';
    }
    return 'Close the loop on the decision and decide if the process should continue or pause.';
  }

  private getCandidateMissingEvidence(stage: CandidateStage, signals: EventType[]): string[] {
    const missing: string[] = [];

    if (stage === 'Contacted') {
      if (!signals.includes(EventType.INTEREST_CHECK) && !signals.includes(EventType.INTERESTED)) {
        missing.push('Clear intent confirmation');
      }
    }

    if (stage === 'Qualified' || stage === 'Interviewing') {
      if (!signals.some(type => [EventType.JOB_SPEC_WRITTEN_IN_MAIL_TEXT, EventType.JOB_SPEC_ATTACHED, EventType.JOB_SPEC_REVIEWED].includes(type))) {
        missing.push('Final role scope or job spec');
      }
      if (!signals.some(type => [EventType.LOCATION_INQUIRY, EventType.LOCATION_NEEDS_MET, EventType.LOCATION_BOTTLENECK].includes(type))) {
        missing.push('Location fit clarity');
      }
      if (!signals.some(type => [EventType.COMPENSATION_INQUIRY, EventType.COMPENSATION_NEEDS_MET, EventType.COMPENSATION_BOTTLENECK].includes(type))) {
        missing.push('Compensation alignment');
      }
    }

    if (stage === 'Interviewing') {
      if (!signals.some(type => [EventType.INTERVIEW_TIME_PROPOSED, EventType.INTERVIEW_TIME_ACCEPTED, EventType.INTERVIEW_SCHEDULED].includes(type))) {
        missing.push('Confirmed interview timing');
      }
    }

    return missing.slice(0, 3);
  }

  private getCandidateActionPlan(thread: InteractionThread, stage: CandidateStage, signals: EventType[]): string[] {
    const actions: string[] = [];

    if (signals.includes(EventType.LOCATION_BOTTLENECK)) {
      actions.push('Clarify remote or hybrid flexibility and confirm the practical location boundary.');
    }

    if (signals.includes(EventType.COMPENSATION_BOTTLENECK)) {
      actions.push('Reconfirm your ideal compensation range and decide whether the role remains a fit.');
    }

    if (signals.includes(EventType.SCREENING_ASSESSMENT_FAILED)) {
      actions.push('Ask for the assessment feedback and evaluate whether a second chance or alternative route makes sense.');
    }

    if (stage === 'Contacted') {
      actions.push('Reply clearly and ask for the role context so the thread can keep moving.');
    }

    if (stage === 'Qualified') {
      actions.push('Send a short, confident response that confirms interest and validates your fit.');
    }

    if (stage === 'Interviewing') {
      actions.push('Confirm the interview slot quickly and prepare a 2-minute narrative on your strongest relevant experience.');
    }

    if (stage === 'Decision') {
      actions.push('Close the loop intentionally and decide whether to continue, pause, or move on.');
    }

    if (!actions.length) {
      actions.push('Follow up with a concise note and keep the thread active while the process is still open.');
    }

    return actions.slice(0, 3);
  }

  getRecommendedActions(thread: InteractionThread | null = this.selectedThread): string[] {
    if (!thread) return [];

    const actions: string[] = [];
    const daysSinceLastEvent = this.getDaysSinceLastEvent(thread);
    const responseRate = this.getRecruiterResponseRate(thread);

    // High-value recruiter
    if (responseRate > 80) {
      actions.push('🎯 High-value recruiter - prioritize this conversation');
    }

    // Needs follow-up
    if (daysSinceLastEvent > 3 && thread.status === InteractionStatus.ACTIVE) {
      actions.push(`⏰ ${daysSinceLastEvent} days since last activity - consider following up`);
    }

    // Stale interaction
    if (thread.status === InteractionStatus.STALE) {
      actions.push('⚠️ This interaction has gone stale - send a follow-up or close it');
    }

    // Personalization tip
    const lastEvent = thread.events[thread.events.length - 1];
    if (lastEvent && lastEvent.senderId !== 'current-user') {
      actions.push('📝 Personalize your reply - increases success rate by 3x');
    }

    // CV requested
    const hasCvRequest = thread.events.some(e => e.eventType === EventType.CV_REQUEST);
    const hasCvSubmission = thread.events.some(e =>
      e.eventType === EventType.CV_SUBMITTED ||
      (e.eventType as unknown as string) === 'CV_SUBMITED' ||
      (e.eventType as unknown as string) === 'CV_SUBMISSION'
    );
    if (hasCvRequest && !hasCvSubmission) {
      actions.push('📄 CV requested - submit your latest version');
    }
    
    // Interview invite without CV submission
    const hasInterviewInvite = thread.events.some(e => e.eventType === EventType.INTERVIEW_INVITE);
    if (hasInterviewInvite && !hasCvSubmission) {
      actions.push('📄 Interview scheduled - submit your CV if you haven\'t already');
    }
    
    return actions;
  }

  getAlerts(): { type: 'warning' | 'info' | 'success', message: string }[] {
    const alerts: { type: 'warning' | 'info' | 'success', message: string }[] = [];
    
    const staleThreads = this.threads.filter(t => t.status === InteractionStatus.STALE).length;
    if (staleThreads > 0) {
      alerts.push({
        type: 'warning',
        message: `${staleThreads} interaction${staleThreads > 1 ? 's' : ''} need${staleThreads === 1 ? 's' : ''} attention`
      });
    }
    
    const needsFollowUp = this.threads.filter(t => {
      const daysSince = Math.floor((Date.now() - new Date(t.lastEventDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 7 && t.status === InteractionStatus.ACTIVE;
    }).length;
    
    if (needsFollowUp > 0) {
      alerts.push({
        type: 'info',
        message: `${needsFollowUp} conversation${needsFollowUp > 1 ? 's' : ''} awaiting follow-up (7+ days)`
      });
    }
    
    const activeCount = this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length;
    if (activeCount > 10) {
      alerts.push({
        type: 'success',
        message: `Great engagement! ${activeCount} active conversations`
      });
    }
    
    return alerts;
  }

  getChannelStats(): { channel: ChannelType, count: number, percentage: number }[] {
    if (!this.threads.length) return [];
    
    const channelCounts = new Map<ChannelType, number>();
    let totalEvents = 0;
    
    this.threads.forEach(thread => {
      thread.events.forEach(event => {
        channelCounts.set(event.channel, (channelCounts.get(event.channel) || 0) + 1);
        totalEvents++;
      });
    });
    
    return Array.from(channelCounts.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: Math.round((count / totalEvents) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getPipelineStats(): { label: string, value: number, color: string }[] {
    return [
      {
        label: 'New',
        value: this.threads.filter(t => t.status === InteractionStatus.NEW).length,
        color: '#0ea5e9'
      },
      {
        label: 'Active',
        value: this.threads.filter(t => t.status === InteractionStatus.ACTIVE).length,
        color: '#10b981'
      },
      {
        label: 'Stale',
        value: this.threads.filter(t => t.status === InteractionStatus.STALE).length,
        color: '#f59e0b'
      },
      {
        label: 'Closed',
        value: this.threads.filter(t => t.status === InteractionStatus.CLOSED).length,
        color: '#6b7280'
      }
    ];
  }
}
