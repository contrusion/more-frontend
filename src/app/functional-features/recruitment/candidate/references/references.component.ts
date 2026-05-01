import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReferenceService } from '../services/reference.service';
import {
  CandidateReference, CreateCandidateReferenceRequest, UpdateCandidateReferenceRequest, ReferenceRelationship
} from '../models/goal.model';

@Component({
  selector: 'app-references',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './references.component.html',
  styleUrls: ['./references.component.css']
})
export class ReferencesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: CandidateReference[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  showForm = false;
  editingItem: CandidateReference | null = null;

  form: CreateCandidateReferenceRequest & UpdateCandidateReferenceRequest = this.emptyForm();

  readonly relationships: { value: ReferenceRelationship; label: string }[] = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'COLLEAGUE', label: 'Colleague' },
    { value: 'MENTOR', label: 'Mentor' },
    { value: 'CLIENT', label: 'Client' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(private service: ReferenceService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.items = data; this.isLoading = false; },
        error: () => { this.errorMessage = 'Failed to load references.'; this.isLoading = false; }
      });
  }

  openCreate(): void { this.editingItem = null; this.form = this.emptyForm(); this.showForm = true; }

  openEdit(item: CandidateReference): void {
    this.editingItem = item;
    this.form = {
      fullName: item.fullName,
      jobTitle: item.jobTitle,
      company: item.company,
      email: item.email,
      phone: item.phone ?? undefined,
      relationship: item.relationship,
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
      this.service.create(this.form as CreateCandidateReferenceRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: () => { this.showForm = false; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
    }
  }

  delete(item: CandidateReference): void {
    if (!confirm(`Delete reference "${item.fullName}"?`)) return;
    this.service.delete(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.load(), error: () => { this.errorMessage = 'Failed to delete.'; } });
  }

  getRelationshipLabel(rel: ReferenceRelationship): string {
    return this.relationships.find(r => r.value === rel)?.label ?? rel;
  }

  private emptyForm(): CreateCandidateReferenceRequest {
    return { fullName: '', jobTitle: '', company: '', email: '', relationship: 'COLLEAGUE', includeInCv: false };
  }
}
