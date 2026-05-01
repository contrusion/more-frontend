import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MilestoneService } from '../../services/milestone.service';
import { GoalMilestone, UpdateMilestoneRequest } from '../../models/goal.model';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './milestone-list.component.html',
  styleUrls: ['./milestone-list.component.css']
})
export class MilestoneListComponent implements OnInit {
  @Input() goalId!: string;
  @Output() milestoneChanged = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  milestones = signal<GoalMilestone[]>([]);
  isLoading = signal(true);
  editingId = signal<string | null>(null);

  // edit form state
  editTitle = '';
  editDescription = '';
  editCompletion = 25;

  readonly percentageOptions = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100% — Done!' }
  ];

  constructor(private milestoneService: MilestoneService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.milestoneService.getMilestones(this.goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ms) => {
          this.milestones.set(ms);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  startEdit(m: GoalMilestone): void {
    this.editingId.set(m.id);
    this.editTitle = m.title;
    this.editDescription = m.description ?? '';
    this.editCompletion = m.completionPercentage;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(m: GoalMilestone): void {
    if (!this.editTitle.trim()) return;
    const req: UpdateMilestoneRequest = {
      title: this.editTitle.trim(),
      description: this.editDescription.trim() || undefined,
      completionPercentage: this.editCompletion
    };
    this.milestoneService.updateMilestone(this.goalId, m.id, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.editingId.set(null);
        this.load();
        this.milestoneChanged.emit();
      });
  }

  delete(m: GoalMilestone): void {
    this.milestoneService.deleteMilestone(this.goalId, m.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.load();
        this.milestoneChanged.emit();
      });
  }

  percentLabel(pct: number): string {
    if (pct === 100) return '✅ Done';
    if (pct >= 75) return '🔥 Almost there';
    if (pct >= 50) return '⚡ Halfway';
    return '🚀 Started';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
