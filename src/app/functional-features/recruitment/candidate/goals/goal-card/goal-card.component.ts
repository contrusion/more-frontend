import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateGoal, GoalStatus } from '../../models/goal.model';
import { MilestoneListComponent } from '../milestone-list/milestone-list.component';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CommonModule, MilestoneListComponent],
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.css']
})
export class GoalCardComponent {
  @Input() goal!: CandidateGoal;
  @Output() edit = new EventEmitter<CandidateGoal>();
  @Output() delete = new EventEmitter<string>();
  @Output() addMilestone = new EventEmitter<CandidateGoal>();
  @Output() reopen = new EventEmitter<string>();
  @Output() milestonesChanged = new EventEmitter<void>();

  GoalStatus = GoalStatus;
  showMilestones = false;

  get statusLabel(): string {
    return this.goal.status.replace('_', ' ');
  }

  get categoryLabel(): string {
    return this.goal.category.charAt(0) + this.goal.category.slice(1).toLowerCase();
  }

  get isOverdue(): boolean {
    if (!this.goal.targetDate) return false;
    return new Date(this.goal.targetDate) < new Date() && this.goal.status !== GoalStatus.COMPLETED;
  }

  onEdit(): void {
    this.edit.emit(this.goal);
  }

  onDelete(): void {
    this.delete.emit(this.goal.id);
  }

  onAddMilestone(): void {
    this.addMilestone.emit(this.goal);
  }

  onReopen(): void {
    this.reopen.emit(this.goal.id);
  }
}
