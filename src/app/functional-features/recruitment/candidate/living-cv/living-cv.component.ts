import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { LivingCvService } from '../services/living-cv.service';
import {
  LivingCv,
  LivingCvGoal,
  GoalMilestone,
  GoalStatus,
  MarketReadinessTier,
  WorkExperience,
  CandidateSkill
} from '../models/goal.model';
import { ClassBadgeDashboardComponent } from './class-badge-dashboard/class-badge-dashboard.component';

@Component({
  selector: 'app-living-cv',
  standalone: true,
  imports: [CommonModule, RouterModule, Message, Tag, ClassBadgeDashboardComponent],
  templateUrl: './living-cv.component.html',
  styleUrls: ['./living-cv.component.css']
})
export class LivingCvComponent implements OnInit {

  cv = signal<LivingCv | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedGoalIds = signal<Set<string>>(new Set());

  constructor(private livingCvService: LivingCvService, private router: Router) {}

  ngOnInit(): void {
    this.livingCvService.getLivingCv().subscribe({
      next: (data) => {
        this.cv.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your Living CV. Please try again.');
        this.loading.set(false);
      }
    });
  }

  toggleGoal(goalId: string): void {
    const current = new Set(this.expandedGoalIds());
    if (current.has(goalId)) {
      current.delete(goalId);
    } else {
      current.add(goalId);
    }
    this.expandedGoalIds.set(current);
  }

  isGoalExpanded(goalId: string): boolean {
    return this.expandedGoalIds().has(goalId);
  }

  getTierLabel(tier: MarketReadinessTier): string {
    const labels: Record<MarketReadinessTier, string> = {
      PLATINUM: '💎 Platinum',
      GOLD: '🥇 Gold',
      SILVER: '🥈 Silver',
      BRONZE: '🥉 Bronze'
    };
    return labels[tier];
  }

  getStatusLabel(status: GoalStatus): string {
    const labels: Record<GoalStatus, string> = {
      NOT_STARTED: 'Not Started',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      ABANDONED: 'Abandoned'
    };
    return labels[status];
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      SKILL: 'Skill',
      CERTIFICATION: 'Certification',
      PROJECT: 'Project',
      LANGUAGE: 'Language',
      OTHER: 'Other'
    };
    return labels[category] ?? category;
  }

  goalsByStatus(status: GoalStatus): LivingCvGoal[] {
    return this.cv()?.goals.filter(g => g.status === status) ?? [];
  }

  publicGoals(): LivingCvGoal[] {
    return this.cv()?.goals.filter(g => g.isPublic) ?? [];
  }

  totalMilestonesFor(goal: LivingCvGoal): number {
    return goal.milestones.length;
  }

  proofCountFor(goal: LivingCvGoal): number {
    return goal.milestones.reduce((sum, m) => sum + m.proofItems.length, 0);
  }

  progressFor(goal: LivingCvGoal): number {
    if (!goal.milestones.length) return 0;
    const max = Math.max(...goal.milestones.map(m => m.completionPercentage));
    return max;
  }

  getProofTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      CERTIFICATE: '📜',
      URL: '🔗',
      GITHUB_REPO: '💻',
      PROJECT_LINK: '🚀',
      EMAIL_RECOMMENDATION: '✉️'
    };
    return icons[type] ?? '📎';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  goalCompletionPct(): number {
    const s = this.cv()?.stats;
    if (!s || !s.totalGoals) return 0;
    return Math.round((s.completedGoals / s.totalGoals) * 100);
  }

  cvCompletionPct(): number {
    const cv = this.cv();
    if (!cv) return 0;
    let score = 0;
    if (cv.profile.biography) score += 15;
    if (cv.workExperience.length) score += 20;
    if (cv.education.length) score += 15;
    if (cv.skills.length) score += 15;
    if (cv.certifications.length) score += 15;
    if (cv.goals.length) score += 10;
    if (cv.references.length) score += 10;
    return Math.min(score, 100);
  }

  isExpiringSoon(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const ms = new Date(dateStr).getTime() - Date.now();
    return ms > 0 && ms < 90 * 864e5;
  }

  isExpired(dateStr: string | null): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  proficiencyPct(level: string): number {
    const map: Record<string, number> = { BEGINNER: 25, INTERMEDIATE: 55, ADVANCED: 80, EXPERT: 100 };
    return map[level?.toUpperCase()] ?? 50;
  }

  // ── Goal staleness ────────────────────────────────────

  isGoalOverdue(goal: LivingCvGoal): boolean {
    if (!goal.targetDate) return false;
    if (goal.status === 'COMPLETED' || goal.status === 'ABANDONED') return false;
    return new Date(goal.targetDate) < new Date();
  }

  isGoalStale(goal: LivingCvGoal): boolean {
    if (goal.status === 'COMPLETED' || goal.status === 'ABANDONED') return false;
    if (this.isGoalOverdue(goal)) return false;
    const progress = this.progressFor(goal);
    if (goal.targetDate) {
      const start = new Date(goal.createdAt).getTime();
      const end = new Date(goal.targetDate).getTime();
      const totalDuration = end - start;
      if (totalDuration <= 0) return false;
      const elapsed = Date.now() - start;
      const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
      return expectedProgress - progress > 25;
    }
    const daysSince = (Date.now() - new Date(goal.updatedAt).getTime()) / 864e5;
    return daysSince > 60;
  }

  overdueGoals(): LivingCvGoal[] {
    return this.cv()?.goals.filter(g => this.isGoalOverdue(g)) ?? [];
  }

  staleGoals(): LivingCvGoal[] {
    return this.cv()?.goals.filter(g => this.isGoalStale(g)) ?? [];
  }

  // ── Proof gap analysis ────────────────────────────────

  milestonesWithoutProof(): number {
    return this.cv()?.goals.reduce((sum, g) =>
      sum + g.milestones.filter(m => m.proofItems.length === 0).length, 0) ?? 0;
  }

  // ── Skills proficiency breakdown ──────────────────────

  skillProficiencyBreakdown(): { level: string; label: string; count: number; pct: number; color: string }[] {
    const skills = this.cv()?.skills ?? [];
    if (!skills.length) return [];
    const levels = [
      { level: 'EXPERT',       label: 'Expert',       color: '#0ea5e9' },
      { level: 'ADVANCED',     label: 'Advanced',     color: '#10b981' },
      { level: 'INTERMEDIATE', label: 'Intermediate', color: '#f59e0b' },
      { level: 'BEGINNER',     label: 'Beginner',     color: '#94a3b8' },
    ];
    return levels
      .map(l => ({
        ...l,
        count: skills.filter(s => s.proficiencyLevel?.toUpperCase() === l.level).length,
        pct: 0
      }))
      .map(l => ({ ...l, pct: Math.round((l.count / skills.length) * 100) }))
      .filter(l => l.count > 0);
  }

  skillsByCategory(): { category: string; skills: CandidateSkill[] }[] {
    const skills = this.cv()?.skills ?? [];
    const map = new Map<string, typeof skills>();
    for (const s of skills) {
      const cat = s.skillCategory?.trim() || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    const order = ['EXPERT', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'];
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, skills]) => ({
        category,
        skills: [...skills].sort((a, b) =>
          order.indexOf(a.proficiencyLevel?.toUpperCase()) - order.indexOf(b.proficiencyLevel?.toUpperCase())
        )
      }));
  }

  proficiencyColor(level: string): string {
    const map: Record<string, string> = {
      EXPERT: '#0ea5e9', ADVANCED: '#10b981', INTERMEDIATE: '#f59e0b', BEGINNER: '#94a3b8'
    };
    return map[level?.toUpperCase()] ?? '#94a3b8';
  }

  // ── Employment gap detection ──────────────────────────

  sortedWorkExperience(): WorkExperience[] {
    return [...(this.cv()?.workExperience ?? [])]
      .filter(j => j.includeInCv)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  private chronologicalWorkExperience(): WorkExperience[] {
    return [...(this.cv()?.workExperience ?? [])]
      .filter(j => j.includeInCv)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  employmentGaps(): { afterJobId: string; beforeJobId: string; gapMonths: number; isExplained: boolean }[] {
    const jobs = this.chronologicalWorkExperience();
    const gaps: { afterJobId: string; beforeJobId: string; gapMonths: number; isExplained: boolean }[] = [];
    for (let i = 0; i < jobs.length - 1; i++) {
      const current = jobs[i];
      const next = jobs[i + 1];
      if (current.isCurrent || !current.endDate) continue;
      const gapDays = (new Date(next.startDate).getTime() - new Date(current.endDate).getTime()) / 864e5;
      if (gapDays > 90) {
        gaps.push({
          afterJobId: current.id,
          beforeJobId: next.id,
          gapMonths: Math.round(gapDays / 30.44),
          isExplained: !!next.gapReason
        });
      }
    }
    return gaps;
  }

  gapAfterJob(jobId: string): { gapMonths: number; isExplained: boolean; gapReason: string | null } | null {
    const gap = this.employmentGaps().find(g => g.afterJobId === jobId);
    if (!gap) return null;
    const beforeJob = this.sortedWorkExperience().find(j => j.id === gap.beforeJobId);
    return { gapMonths: gap.gapMonths, isExplained: gap.isExplained, gapReason: beforeJob?.gapReason ?? null };
  }

  // ── Recommended actions ───────────────────────────────

  getRecommendedActions(): { text: string; href: string; severity: 'danger' | 'warn' | 'info' }[] {
    const actions: { text: string; href: string; severity: 'danger' | 'warn' | 'info' }[] = [];
    const cv = this.cv();
    if (!cv) return actions;

    const overdue = this.overdueGoals();
    if (overdue.length > 0)
      actions.push({ text: `${overdue.length} goal${overdue.length > 1 ? 's are' : ' is'} past target date`, href: '#cv-goals', severity: 'danger' });

    const stale = this.staleGoals();
    if (stale.length > 0)
      actions.push({ text: `${stale.length} goal${stale.length > 1 ? 's are' : ' is'} falling behind expected pace`, href: '#cv-goals', severity: 'warn' });

    const proofGaps = this.milestonesWithoutProof();
    if (proofGaps > 0)
      actions.push({ text: `${proofGaps} milestone${proofGaps > 1 ? 's have' : ' has'} no attached proof`, href: '#cv-goals', severity: 'warn' });

    const unexplainedGaps = this.employmentGaps().filter(g => !g.isExplained);
    if (unexplainedGaps.length > 0)
      actions.push({ text: `${unexplainedGaps.length} career gap${unexplainedGaps.length > 1 ? 's need' : ' needs'} explanation`, href: '#cv-work', severity: 'warn' });

    const expiring = cv.certifications.filter(c => this.isExpiringSoon(c.expiryDate));
    if (expiring.length > 0)
      actions.push({ text: `${expiring.length} certification${expiring.length > 1 ? 's expire' : ' expires'} within 90 days`, href: '#cv-certs', severity: 'warn' });

    const expired = cv.certifications.filter(c => this.isExpired(c.expiryDate));
    if (expired.length > 0)
      actions.push({ text: `${expired.length} certification${expired.length > 1 ? 's have' : ' has'} expired`, href: '#cv-certs', severity: 'danger' });

    if (!cv.profile.biography)
      actions.push({ text: 'Add a biography to boost profile strength', href: '/personal-development/profile', severity: 'info' });

    return actions;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  navigateAction(href: string): void {
    if (href.startsWith('#')) {
      this.scrollTo(href.slice(1));
    } else {
      this.router.navigate([href]);
    }
  }
}
