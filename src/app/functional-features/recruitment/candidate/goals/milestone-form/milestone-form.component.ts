import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateGoal, CreateMilestoneRequest, ProofType } from '../../models/goal.model';

@Component({
  selector: 'app-milestone-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './milestone-form.component.html',
  styleUrls: ['./milestone-form.component.css']
})
export class MilestoneFormComponent implements OnInit {
  @Input() goal!: CandidateGoal;
  @Output() save = new EventEmitter<CreateMilestoneRequest>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  description = '';
  completionPercentage = 25;
  isSaving = false;

  ProofType = ProofType;

  readonly percentageOptions = [
    { value: 25, label: '25% — Just started' },
    { value: 50, label: '50% — Halfway there' },
    { value: 75, label: '75% — Almost done' },
    { value: 100, label: '100% — Goal completed!' }
  ];

  ngOnInit(): void {}

  get isValid(): boolean {
    return this.title.trim().length > 0;
  }

  onSubmit(): void {
    if (!this.isValid) return;
    this.save.emit({
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      completionPercentage: this.completionPercentage
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('milestone-form-overlay')) {
      this.onCancel();
    }
  }
}
