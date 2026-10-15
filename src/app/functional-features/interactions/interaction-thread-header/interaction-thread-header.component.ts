import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

/**
 * Presentational header for a candidate-view interaction accordion row.
 * All values are computed by the parent so this component only owns the layout.
 */
@Component({
  selector: 'app-interaction-thread-header',
  standalone: true,
  imports: [NgClass, MatExpansionModule],
  templateUrl: './interaction-thread-header.component.html',
  styleUrls: ['./interaction-thread-header.component.css']
})
export class InteractionThreadHeaderComponent {
  @Input({ required: true }) initials = '';
  @Input({ required: true }) recruiterName = '';
  @Input() recruiterCompany?: string;
  @Input({ required: true }) opportunity = '';
  @Input({ required: true }) statusSummary = '';
  @Input({ required: true }) dealBreakerCount = 0;
  @Input() updateStale = false;
  @Input({ required: true }) updatedLabel = '';
  @Input({ required: true }) statusLabel = '';
  @Input({ required: true }) statusBadgeClass = '';
}
