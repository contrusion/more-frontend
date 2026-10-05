import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  RecruitmentDatasetService,
  DatasetExportRequest,
  DatasetExportResponse
} from '../services/recruitment-dataset.service';
import {
  MlMonitoringService,
  MlPerformanceSummary,
  MlReviewQueueEntry,
  MlAuditEntry
} from '../../admin/ml-monitoring/ml-monitoring.service';

@Component({
  selector: 'app-dataset-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dataset-export.component.html',
  styleUrls: ['./dataset-export.component.css']
})
export class DatasetExportComponent implements OnInit {
  exportConfig: DatasetExportRequest = {
    sinceDays: 365,
    maxResults: 500,
    includeSent: true,
    includeInbox: true
  };

  performance = signal<MlPerformanceSummary | null>(null);
  pendingReviews = signal<MlReviewQueueEntry[]>([]);
  auditEntries = signal<MlAuditEntry[]>([]);
  loading = signal(false);
  previewLoading = signal(false);
  summaryLoading = signal(true);
  refreshing = signal(false);
  exportResponse: DatasetExportResponse | null = null;
  previewData: DatasetExportResponse | null = null;
  errorMessage: string | null = null;
  resolvingMessageId: string | null = null;

  constructor(
    private datasetService: RecruitmentDatasetService,
    private mlMonitoringService: MlMonitoringService
  ) {}

  ngOnInit(): void {
    this.loadMlOverview();
    this.loadPreview();
  }

  refreshOverview(): void {
    this.refreshing.set(true);
    this.loadMlOverview();
  }

  loadPreview(): void {
    this.previewLoading.set(true);
    this.errorMessage = null;

    this.datasetService.previewDataset(30).subscribe({
      next: (response) => {
        this.previewData = response;
        this.previewLoading.set(false);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load preview: ' + (error.error?.message || error.message);
        this.previewLoading.set(false);
      }
    });
  }

  private loadMlOverview(): void {
    this.summaryLoading.set(true);
    this.errorMessage = null;

    forkJoin({
      performance: this.mlMonitoringService.getPerformanceSummary(),
      reviews: this.mlMonitoringService.getPendingReviews(),
      audit: this.mlMonitoringService.getRecentAuditEntries(6)
    }).subscribe({
      next: ({ performance, reviews, audit }) => {
        this.performance.set(performance);
        this.pendingReviews.set(reviews);
        this.auditEntries.set(audit);
        this.summaryLoading.set(false);
        this.refreshing.set(false);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load ML monitoring data: ' + (error.error?.message || error.message);
        this.summaryLoading.set(false);
        this.refreshing.set(false);
      }
    });
  }

  resolveQueueItem(messageId: string, accepted: boolean): void {
    this.resolvingMessageId = messageId;
    this.mlMonitoringService.resolveReviewDecision(messageId, accepted).subscribe({
      next: () => {
        this.resolvingMessageId = null;
        this.refreshOverview();
      },
      error: (error) => {
        this.resolvingMessageId = null;
        this.errorMessage = 'Unable to update review status: ' + (error.error?.message || error.message);
      }
    });
  }

  exportJson(): void {
    this.loading.set(true);
    this.errorMessage = null;
    this.exportResponse = null;

    this.datasetService.exportDataset(this.exportConfig).subscribe({
      next: (response) => {
        this.exportResponse = response;
        this.loading.set(false);

        if (response.success) {
          this.downloadJson(response);
        } else {
          this.errorMessage = 'Export completed with errors: ' + response.errors.join(', ');
        }
      },
      error: (error) => {
        this.errorMessage = 'Export failed: ' + (error.error?.message || error.message);
        this.loading.set(false);
      }
    });
  }

  exportCsv(): void {
    this.loading.set(true);
    this.errorMessage = null;

    this.datasetService.exportDatasetCsv(this.exportConfig).subscribe({
      next: (csvBlob) => {
        this.datasetService.downloadCsv(csvBlob);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage = 'CSV export failed: ' + (error.error?.message || error.message);
        this.loading.set(false);
      }
    });
  }

  private downloadJson(data: DatasetExportResponse): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `recruitment_dataset_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  resetConfig(): void {
    this.exportConfig = {
      sinceDays: 365,
      maxResults: 500,
      includeSent: true,
      includeInbox: true
    };
  }
}
