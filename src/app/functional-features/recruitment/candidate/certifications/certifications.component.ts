import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CertificationService } from '../services/certification.service';
import { Certification, CreateCertificationRequest, UpdateCertificationRequest } from '../models/goal.model';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.css']
})
export class CertificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: Certification[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  showForm = false;
  editingItem: Certification | null = null;

  form: CreateCertificationRequest & UpdateCertificationRequest = this.emptyForm();

  constructor(private service: CertificationService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.items = data; this.isLoading = false; },
        error: () => { this.errorMessage = 'Failed to load certifications.'; this.isLoading = false; }
      });
  }

  openCreate(): void { this.editingItem = null; this.form = this.emptyForm(); this.showForm = true; }

  openEdit(item: Certification): void {
    this.editingItem = item;
    this.form = {
      name: item.name,
      issuingOrganization: item.issuingOrganization,
      issueDate: item.issueDate,
      expiryDate: item.expiryDate ?? undefined,
      credentialId: item.credentialId ?? undefined,
      credentialUrl: item.credentialUrl ?? undefined,
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
      this.service.create(this.form as CreateCertificationRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: () => { this.showForm = false; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
    }
  }

  delete(item: Certification): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.service.delete(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.load(), error: () => { this.errorMessage = 'Failed to delete.'; } });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
  }

  private emptyForm(): CreateCertificationRequest {
    return { name: '', issuingOrganization: '', issueDate: '', includeInCv: true };
  }
}
