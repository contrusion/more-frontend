import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateGoal, CreateGoalRequest, GoalCategory, GoalStatus, UpdateGoalRequest } from '../../models/goal.model';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.css']
})
export class GoalFormComponent implements OnChanges {
  @Input() goal: CandidateGoal | null = null; // null = create mode
  @Output() save = new EventEmitter<CreateGoalRequest | UpdateGoalRequest>();
  @Output() cancel = new EventEmitter<void>();

  GoalCategory = GoalCategory;
  GoalStatus = GoalStatus;

  categoryOptions = Object.values(GoalCategory);
  statusOptions = Object.values(GoalStatus);

  form = {
    title: '',
    description: '',
    category: GoalCategory.SKILL,
    targetDate: '',
    status: GoalStatus.NOT_STARTED,
    isPublic: true
  };

  get isEditMode(): boolean {
    return this.goal !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['goal']) {
      if (this.goal) {
        this.form = {
          title: this.goal.title,
          description: this.goal.description ?? '',
          category: this.goal.category,
          targetDate: this.goal.targetDate ?? '',
          status: this.goal.status,
          isPublic: this.goal.isPublic
        };
      } else {
        this.resetForm();
      }
    }
  }

  onSubmit(): void {
    if (!this.form.title.trim()) return;

    const payload: CreateGoalRequest | UpdateGoalRequest = {
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      category: this.form.category,
      targetDate: this.form.targetDate || undefined,
      isPublic: this.form.isPublic,
      ...(this.isEditMode ? { status: this.form.status } : {})
    };

    this.save.emit(payload);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('goal-form-overlay')) {
      this.onCancel();
    }
  }

  labelFor(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private resetForm(): void {
    this.form = {
      title: '',
      description: '',
      category: GoalCategory.SKILL,
      targetDate: '',
      status: GoalStatus.NOT_STARTED,
      isPublic: true
    };
  }
}
