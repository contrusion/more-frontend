import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityService } from '../services/opportunity.service';
import { CandidateWatchRequest, MyApplication, WatchRequestDecision } from '../models/opportunity.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-applications.component.html',
  styleUrl: './my-applications.component.css'
})
export class MyApplicationsComponent implements OnInit {
  applications = signal<MyApplication[]>([]);
  pendingWatchRequests = signal<CandidateWatchRequest[]>([]);
  loading = signal(true);
  watchRequestsLoading = signal(true);
  error = signal<string | null>(null);
  watchRequestError = signal<string | null>(null);
  withdrawingApplicationId = signal<string | null>(null);
  respondingWatchRequestId = signal<string | null>(null);

  constructor(private readonly opportunityService: OpportunityService) {}

  ngOnInit(): void {
    this.loadPendingWatchRequests();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.opportunityService.getMyApplications().subscribe({
      next: (data) => {
        this.applications.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your applications. Please try again.');
        this.loading.set(false);
      }
    });
  }

  loadPendingWatchRequests(): void {
    this.watchRequestsLoading.set(true);
    this.watchRequestError.set(null);
    this.opportunityService.getPendingWatchRequests().subscribe({
      next: (requests) => {
        this.pendingWatchRequests.set(requests);
        this.watchRequestsLoading.set(false);
      },
      error: () => {
        this.watchRequestError.set('Failed to load watch requests. Please try again.');
        this.watchRequestsLoading.set(false);
      }
    });
  }

  watchReasonLabel(reason: CandidateWatchRequest['triggerReason']): string {
    return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  respondToWatchRequest(request: CandidateWatchRequest, decision: WatchRequestDecision): void {
    if (this.respondingWatchRequestId() === request.id) {
      return;
    }

    this.respondingWatchRequestId.set(request.id);
    this.watchRequestError.set(null);

    this.opportunityService.respondToWatchRequest(request.id, { decision }).subscribe({
      next: () => {
        this.pendingWatchRequests.update((current) =>
          current.filter((watchRequest) => watchRequest.id !== request.id)
        );
        this.respondingWatchRequestId.set(null);
      },
      error: () => {
        this.watchRequestError.set('Could not submit your response. Please try again.');
        this.respondingWatchRequestId.set(null);
      }
    });
  }

  statusLabel(status: string): string {
    return status?.replace(/_/g, ' ') ?? status;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED':        return 'status-submitted';
      case 'REVIEWED':         return 'status-reviewed';
      case 'SCREENING':
      case 'INTERVIEWING':
      case 'ASSESSMENT':       return 'status-progress';
      case 'OFFER_CONSIDERATION':
      case 'OFFER_EXTENDED':
      case 'OFFER_ACCEPTED':
      case 'HIRED':            return 'status-success';
      case 'REJECTED':
      case 'WITHDRAWN':        return 'status-closed';
      default:                 return 'status-submitted';
    }
  }

  formatJobType(type: string): string {
    return type?.replace(/_/g, ' ') ?? '';
  }

  canWithdraw(app: MyApplication): boolean {
    return app.status === 'SUBMITTED';
  }

  withdraw(app: MyApplication): void {
    if (!this.canWithdraw(app) || this.withdrawingApplicationId() === app.id) {
      return;
    }

    this.withdrawingApplicationId.set(app.id);
    this.opportunityService.withdraw(app.jobAdvertisementId).subscribe({
      next: (updated) => {
        this.applications.update((list) =>
          list.map((item) =>
            item.id === app.id
              ? {
                  ...item,
                  status: updated.status,
                  lastStatusChange: updated.lastStatusChange,
                }
              : item
          )
        );
        this.withdrawingApplicationId.set(null);
      },
      error: () => {
        this.error.set('Failed to withdraw your application. Please try again.');
        this.withdrawingApplicationId.set(null);
      }
    });
  }
}
