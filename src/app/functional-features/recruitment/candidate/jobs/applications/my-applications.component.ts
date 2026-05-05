import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityService } from '../services/opportunity.service';
import { MyApplication } from '../models/opportunity.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-applications.component.html',
  styleUrl: './my-applications.component.css'
})
export class MyApplicationsComponent implements OnInit {
  applications = signal<MyApplication[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private readonly opportunityService: OpportunityService) {}

  ngOnInit(): void {
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
}
