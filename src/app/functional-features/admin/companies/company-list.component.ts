import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCompanyRow, AdminCompanyService } from './admin-company.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {
  companies = signal<AdminCompanyRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  activeStatusFilter = signal<string>('ALL');

  readonly statusOptions = ['ALL', 'ONLINE', 'OFFLINE', 'PENDING_CHECK', 'UNVERIFIED'];

  readonly filteredCompanies = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.activeStatusFilter();

    return this.companies().filter(company => {
      const companyStatus = (company.websiteStatus ?? 'UNVERIFIED').toUpperCase();
      const matchesStatus = status === 'ALL' || companyStatus === status;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        (company.name ?? '').toLowerCase().includes(query)
        || (company.website ?? '').toLowerCase().includes(query)
        || (company.industry ?? '').toLowerCase().includes(query)
        || (company.headquarters ?? '').toLowerCase().includes(query)
      );
    });
  });

  constructor(private companyService: AdminCompanyService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.error.set(null);

    this.companyService.listCompanies().subscribe({
      next: companies => {
        const sorted = [...companies].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        this.companies.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load companies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyStatusFilter(status: string): void {
    this.activeStatusFilter.set(status);
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  formatDate(iso: string | null): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  statusLabel(status: string | null): string {
    const normalized = (status ?? 'UNVERIFIED').toUpperCase();
    return normalized.replace('_', ' ');
  }
}
