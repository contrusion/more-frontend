import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  RecruitmentDatasetService, 
  DatasetExportRequest, 
  DatasetExportResponse 
} from '../services/recruitment-dataset.service';

@Component({
  selector: 'app-dataset-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dataset-export.component.html',
  styleUrls: ['./dataset-export.component.css']
})
export class DatasetExportComponent implements OnInit {
  
  // Export configuration
  exportConfig: DatasetExportRequest = {
    sinceDays: 365,
    maxResults: 500,
    includeSent: true,
    includeInbox: true
  };
  
  // UI State
  loading = false;
  previewLoading = false;
  exportResponse: DatasetExportResponse | null = null;
  previewData: DatasetExportResponse | null = null;
  errorMessage: string | null = null;
  
  constructor(private datasetService: RecruitmentDatasetService) {}
  
  ngOnInit(): void {
    // Load preview on init
    this.loadPreview();
  }
  
  /**
   * Load preview of first 10 emails
   */
  loadPreview(): void {
    this.previewLoading = true;
    this.errorMessage = null;
    
    this.datasetService.previewDataset(30).subscribe({
      next: (response) => {
        this.previewData = response;
        this.previewLoading = false;
        console.log('Preview loaded:', response);
      },
      error: (error) => {
        console.error('Failed to load preview:', error);
        this.errorMessage = 'Failed to load preview: ' + (error.error?.message || error.message);
        this.previewLoading = false;
      }
    });
  }
  
  /**
   * Export full dataset as JSON
   */
  exportJson(): void {
    this.loading = true;
    this.errorMessage = null;
    this.exportResponse = null;
    
    this.datasetService.exportDataset(this.exportConfig).subscribe({
      next: (response) => {
        this.exportResponse = response;
        this.loading = false;
        
        if (response.success) {
          console.log('Export successful:', response);
          
          // Optionally download as JSON file
          this.downloadJson(response);
        } else {
          this.errorMessage = 'Export completed with errors: ' + response.errors.join(', ');
        }
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.errorMessage = 'Export failed: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }
  
  /**
   * Export dataset as CSV for labeling
   */
  exportCsv(): void {
    this.loading = true;
    this.errorMessage = null;
    
    this.datasetService.exportDatasetCsv(this.exportConfig).subscribe({
      next: (csvBlob) => {
        this.datasetService.downloadCsv(csvBlob);
        this.loading = false;
        console.log('CSV export successful');
      },
      error: (error) => {
        console.error('CSV export failed:', error);
        this.errorMessage = 'CSV export failed: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }
  
  /**
   * Download JSON data as file
   */
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
  
  /**
   * Reset export configuration to defaults
   */
  resetConfig(): void {
    this.exportConfig = {
      sinceDays: 365,
      maxResults: 500,
      includeSent: true,
      includeInbox: true
    };
  }
}
