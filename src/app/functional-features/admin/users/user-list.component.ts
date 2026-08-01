import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminUserService, AdminUserRow, AdminUserPage, AccountType } from './admin-user.service';

type TypeFilter = AccountType | null;
type PremiumFilter = boolean | null;

interface TypeOption { label: string; value: TypeFilter; }
interface PremiumOption { label: string; value: PremiumFilter; }

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  users = signal<AdminUserRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  activeTypeFilter = signal<TypeFilter>(null);
  activePremiumFilter = signal<PremiumFilter>(null);
  searchQuery = '';

  readonly typeOptions: TypeOption[] = [
    { label: 'All',            value: null           },
    { label: 'Applicant',      value: 'APPLICANT'    },
    { label: 'Recruiter',      value: 'RECRUITER'    },
    { label: 'Hiring Manager', value: 'HIRING_MANAGER'},
    { label: 'Admin',          value: 'ADMIN'        },
    { label: 'Employer',       value: 'EMPLOYER'     },
  ];

  readonly premiumOptions: PremiumOption[] = [
    { label: 'All',         value: null  },
    { label: '⭐ Premium',  value: true  },
    { label: 'Standard',    value: false },
  ];

  constructor(private userService: AdminUserService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const types = this.activeTypeFilter() ? [this.activeTypeFilter()! as AccountType] : undefined;
    this.userService.listUsers({
      page: this.currentPage(),
      size: 20,
      types,
      premium: this.activePremiumFilter(),
      search: this.searchQuery || undefined,
    }).subscribe({
      next: (page: AdminUserPage) => {
        this.users.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyTypeFilter(value: TypeFilter): void {
    this.activeTypeFilter.set(value);
    this.currentPage.set(0);
    this.load();
  }

  applyPremiumFilter(value: PremiumFilter): void {
    this.activePremiumFilter.set(value);
    this.currentPage.set(0);
    this.load();
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.load();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatTypes(types: AccountType[]): string {
    if (!types || types.length === 0) return '—';
    return types.map(t => t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ')).join(', ');
  }

  typeLabel(t: AccountType): string {
    const map: Record<AccountType, string> = {
      APPLICANT: 'Applicant',
      RECRUITER: 'Recruiter',
      HIRING_MANAGER: 'Hiring Manager',
      ADMIN: 'Admin',
      EMPLOYER: 'Employer',
    };
    return map[t] ?? t;
  }
}
