import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EducationService } from '../services/education.service';
import { Education, CreateEducationRequest, UpdateEducationRequest } from '../models/goal.model';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.css']
})
export class EducationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: Education[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  showForm = false;
  editingItem: Education | null = null;

  form: CreateEducationRequest & UpdateEducationRequest = this.emptyForm();

  constructor(private service: EducationService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.items = data; this.isLoading = false; },
        error: () => { this.errorMessage = 'Failed to load education.'; this.isLoading = false; }
      });
  }

  openCreate(): void { this.editingItem = null; this.form = this.emptyForm(); this.showForm = true; }

  openEdit(item: Education): void {
    this.editingItem = item;
    this.form = {
      institution: item.institution,
      degree: item.degree ?? undefined,
      fieldOfStudy: item.fieldOfStudy ?? undefined,
      startDate: item.startDate,
      endDate: item.endDate ?? undefined,
      isCurrent: item.isCurrent,
      grade: item.grade ?? undefined,
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
      this.service.create(this.form as CreateEducationRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: () => { this.showForm = false; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
    }
  }

  delete(item: Education): void {
    if (!confirm(`Delete "${item.institution}"?`)) return;
    this.service.delete(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.load(), error: () => { this.errorMessage = 'Failed to delete.'; } });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
  }

  private emptyForm(): CreateEducationRequest {
    return { institution: '', isCurrent: false, includeInCv: true };
  }
}
