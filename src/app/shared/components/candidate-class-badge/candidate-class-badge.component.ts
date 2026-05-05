import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateClass } from '../../../functional-features/recruitment/candidate/models/goal.model';

/**
 * Reusable class badge — shows emoji + label with tier colour.
 * Optional `tooltip` input surfaces the recruiter hover explanation.
 *
 * Usage:
 *   <app-candidate-class-badge [candidateClass]="result.candidateClass"
 *                               [tooltip]="result.classTooltip" />
 */
@Component({
  selector: 'app-candidate-class-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="class-badge class-badge--{{ candidateClass | lowercase }}"
          [title]="tooltip ?? ''">
      {{ label }}
    </span>
  `,
  styles: [`
    .class-badge {
      display: inline-block;
      padding: 0.22rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
      letter-spacing: 0.03em;
      cursor: default;
    }

    .class-badge--all_star {
      background: linear-gradient(135deg, #9b59b6, #6c3483);
      color: #fff;
      box-shadow: 0 2px 8px rgba(155, 89, 182, 0.50);
    }

    .class-badge--gold {
      background: linear-gradient(135deg, #fbbf24, #d97706);
      color: #fff;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.45);
    }

    .class-badge--silver {
      background: linear-gradient(135deg, #94a3b8, #64748b);
      color: #fff;
      box-shadow: 0 2px 8px rgba(100, 116, 139, 0.35);
    }

    .class-badge--bronze {
      background: linear-gradient(135deg, #b45309, #92400e);
      color: #fff;
      box-shadow: 0 2px 8px rgba(180, 83, 9, 0.35);
    }
  `]
})
export class CandidateClassBadgeComponent {
  @Input({ required: true }) candidateClass!: CandidateClass;
  @Input() tooltip?: string;

  get label(): string {
    const labels: Record<CandidateClass, string> = {
      ALL_STAR: '⭐ All-Star',
      GOLD: '🥇 Gold',
      SILVER: '🥈 Silver',
      BRONZE: '🥉 Bronze'
    };
    return labels[this.candidateClass];
  }
}
