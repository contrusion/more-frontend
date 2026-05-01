import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GoalService } from '../services/goal.service';
import { MilestoneService } from '../services/milestone.service';
import { CandidateGoal, CreateGoalRequest, GoalCategory, GoalStatus, UpdateGoalRequest, CreateMilestoneRequest } from '../models/goal.model';
import { GoalCardComponent } from './goal-card/goal-card.component';
import { GoalFormComponent } from './goal-form/goal-form.component';
import { MilestoneFormComponent } from './milestone-form/milestone-form.component';

type SortOption = 'newest' | 'oldest' | 'target-date' | 'title';

@Component({
  selector: 'app-candidate-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, GoalCardComponent, GoalFormComponent, MilestoneFormComponent],
  templateUrl: './candidate-goals.component.html',
  styleUrls: ['./candidate-goals.component.css']
})
export class CandidateGoalsComponent implements OnInit {
  private destroy$ = new Subject<void>();

  goals: CandidateGoal[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  showForm = false;
  editingGoal: CandidateGoal | null = null;

  showMilestoneForm = false;
  milestoneGoal: CandidateGoal | null = null;

  // Filter & sort state
  searchQuery = '';
  statusFilter: GoalStatus | '' = '';
  categoryFilter: GoalCategory | '' = '';
  sortBy: SortOption = 'newest';

  GoalStatus = GoalStatus;
  GoalCategory = GoalCategory;

  readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: GoalStatus.NOT_STARTED, label: 'Not Started' },
    { value: GoalStatus.IN_PROGRESS, label: 'In Progress' },
    { value: GoalStatus.COMPLETED, label: 'Completed' },
    { value: GoalStatus.ABANDONED, label: 'Abandoned' }
  ];

  readonly categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: GoalCategory.SKILL, label: 'Skill' },
    { value: GoalCategory.CERTIFICATION, label: 'Certification' },
    { value: GoalCategory.PROJECT, label: 'Project' },
    { value: GoalCategory.LANGUAGE, label: 'Language' },
    { value: GoalCategory.OTHER, label: 'Other' }
  ];

  readonly sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'target-date', label: 'Target date' },
    { value: 'title', label: 'Title A–Z' }
  ];

  constructor(private goalService: GoalService, private milestoneService: MilestoneService) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGoals(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.goalService.getGoals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: goals => {
          this.goals = goals;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load goals. Please try again.';
          this.isLoading = false;
        }
      });
  }

  get filteredGoals(): CandidateGoal[] {
    let result = [...this.goals];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (this.statusFilter) {
      result = result.filter(g => g.status === this.statusFilter);
    }

    if (this.categoryFilter) {
      result = result.filter(g => g.category === this.categoryFilter);
    }

    switch (this.sortBy) {
      case 'oldest':
        result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'target-date':
        result.sort((a, b) => {
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return a.targetDate.localeCompare(b.targetDate);
        });
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // newest
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery.trim() || !!this.statusFilter || !!this.categoryFilter;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.categoryFilter = '';
  }

  openCreateForm(): void {
    this.editingGoal = null;
    this.showForm = true;
  }

  openEditForm(goal: CandidateGoal): void {
    this.editingGoal = goal;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingGoal = null;
  }

  onSave(request: CreateGoalRequest | UpdateGoalRequest): void {
    if (this.editingGoal) {
      this.goalService.updateGoal(this.editingGoal.id, request as UpdateGoalRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: updated => {
            this.goals = this.goals.map(g => g.id === updated.id ? updated : g);
            this.closeForm();
          },
          error: () => { this.errorMessage = 'Failed to update goal.'; }
        });
    } else {
      this.goalService.createGoal(request as CreateGoalRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: created => {
            this.goals = [created, ...this.goals];
            this.closeForm();
          },
          error: () => { this.errorMessage = 'Failed to create goal.'; }
        });
    }
  }

  onDelete(goalId: string): void {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    this.goalService.deleteGoal(goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.goals = this.goals.filter(g => g.id !== goalId); },
        error: () => { this.errorMessage = 'Failed to delete goal.'; }
      });
  }

  openMilestoneForm(goal: CandidateGoal): void {
    this.milestoneGoal = goal;
    this.showMilestoneForm = true;
  }

  closeMilestoneForm(): void {
    this.showMilestoneForm = false;
    this.milestoneGoal = null;
  }

  onSaveMilestone(request: CreateMilestoneRequest): void {
    if (!this.milestoneGoal) return;
    const goalId = this.milestoneGoal.id;
    this.milestoneService.createMilestone(goalId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeMilestoneForm();
          this.loadGoals(); // refresh to pick up new status + milestoneCount
        },
        error: () => { this.errorMessage = 'Failed to log milestone.'; }
      });
  }

  onReopen(goalId: string): void {
    this.goalService.reopenGoal(goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.goals = this.goals.map(g => g.id === updated.id ? updated : g);
        },
        error: () => { this.errorMessage = 'Failed to reopen goal.'; }
      });
  }

  get activeCount(): number {
    return this.goals.filter(g => g.status !== GoalStatus.COMPLETED && g.status !== GoalStatus.ABANDONED).length;
  }

  get completedCount(): number {
    return this.goals.filter(g => g.status === GoalStatus.COMPLETED).length;
  }
}
