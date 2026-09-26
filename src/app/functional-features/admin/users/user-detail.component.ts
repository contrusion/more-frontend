import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminUserService, AdminUserDetail, AccountType } from './admin-user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user = signal<AdminUserDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Suspend/reactivate dialog
  showSuspendDialog = signal(false);
  suspendReason = '';
  actionLoading = signal(false);
  actionError = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: AdminUserService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/admin/users']); return; }
    this.userService.getUser(id).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: () => { this.error.set('Failed to load user profile. Please try again.'); this.loading.set(false); }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  openSuspendDialog(): void {
    this.suspendReason = '';
    this.actionError.set(null);
    this.showSuspendDialog.set(true);
  }

  closeSuspendDialog(): void {
    this.showSuspendDialog.set(false);
  }

  confirmSuspend(): void {
    const u = this.user();
    if (!u || !this.suspendReason.trim()) return;
    this.actionLoading.set(true);
    this.actionError.set(null);
    this.userService.updateUserStatus(u.id, false, this.suspendReason.trim()).subscribe({
      next: updated => {
        this.user.set(updated);
        this.actionLoading.set(false);
        this.showSuspendDialog.set(false);
      },
      error: () => {
        this.actionError.set('Failed to suspend account. Please try again.');
        this.actionLoading.set(false);
      }
    });
  }

  reactivate(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.actionError.set(null);
    this.userService.updateUserStatus(u.id, true).subscribe({
      next: updated => {
        this.user.set(updated);
        this.actionLoading.set(false);
      },
      error: () => {
        this.actionError.set('Failed to reactivate account. Please try again.');
        this.actionLoading.set(false);
      }
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
