import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LivingCvService } from '../services/living-cv.service';
import {
  LivingCv,
  LivingCvGoal,
  GoalMilestone,
  GoalStatus,
  CandidateClass
} from '../models/goal.model';

@Component({
  selector: 'app-living-cv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './living-cv.component.html',
  styleUrls: ['./living-cv.component.css']
})
export class LivingCvComponent implements OnInit {

  cv = signal<LivingCv | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedGoalIds = signal<Set<string>>(new Set());

  constructor(private livingCvService: LivingCvService) {}

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

  getClassLabel(cls: CandidateClass): string {
    const labels: Record<CandidateClass, string> = {
      GOLD: '🥇 Gold',
      SILVER: '🥈 Silver',
      BRONZE: '🥉 Bronze'
    };
    return labels[cls];
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
}
