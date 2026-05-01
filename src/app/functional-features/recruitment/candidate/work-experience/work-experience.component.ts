import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WorkExperienceService } from '../services/work-experience.service';
import {
  WorkExperience, CreateWorkExperienceRequest, UpdateWorkExperienceRequest, EmploymentType
} from '../models/goal.model';

@Component({
  selector: 'app-work-experience',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-experience.component.html',
  styleUrls: ['./work-experience.component.css']
})
export class WorkExperienceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: WorkExperience[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  showForm = false;
  editingItem: WorkExperience | null = null;

  form: CreateWorkExperienceRequest & UpdateWorkExperienceRequest = this.emptyForm();

  readonly employmentTypes: { value: EmploymentType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'FREELANCE', label: 'Freelance' }
  ];

  constructor(private service: WorkExperienceService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.items = data; this.isLoading = false; },
        error: () => { this.errorMessage = 'Failed to load work experience.'; this.isLoading = false; }
      });
  }

  openCreate(): void {
    this.editingItem = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  openEdit(item: WorkExperience): void {
    this.editingItem = item;
    this.form = {
      companyName: item.companyName,
      jobTitle: item.jobTitle,
      employmentType: item.employmentType ?? undefined,
      startDate: item.startDate,
      endDate: item.endDate ?? undefined,
      isCurrent: item.isCurrent,
      location: item.location ?? undefined,
      description: item.description ?? undefined,
      includeInCv: item.includeInCv
    };
    this.showForm = true;
  }

  cancel(): void { this.showForm = false; }

  save(): void {
    if (this.editingItem) {
      this.service.update(this.editingItem.id, this.form)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: () => { this.showForm = false; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
    } else {
      this.service.create(this.form as CreateWorkExperienceRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: () => { this.showForm = false; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
    }
  }

  delete(item: WorkExperience): void {
    if (!confirm(`Delete "${item.companyName} – ${item.jobTitle}"?`)) return;
    this.service.delete(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.load(), error: () => { this.errorMessage = 'Failed to delete.'; } });
  }

  getEmploymentLabel(type: EmploymentType | null): string {
    return this.employmentTypes.find(t => t.value === type)?.label ?? '';
  }

  formatDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
  }

  private emptyForm(): CreateWorkExperienceRequest {
    return { companyName: '', jobTitle: '', startDate: '', isCurrent: false, includeInCv: true };
  }
}
