import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketReadinessTier } from '../../../functional-features/recruitment/candidate/models/goal.model';

/**
 * Reusable class badge — shows emoji + label with tier colour.
 * The `isAllStar` flag adds a ⭐ overlay on top of the base tier.
 *
 * Usage:
 *   <app-candidate-class-badge [marketReadinessTier]="result.marketReadinessTier"
 *                               [isAllStar]="result.isAllStar"
 *                               [tooltip]="result.tierCardMessage" />
 */
@Component({
  selector: 'app-candidate-class-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="class-badge class-badge--{{ badgeClass }}"
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

    .class-badge--platinum {
      background: linear-gradient(135deg, #e2e8f0, #94a3b8);
      color: #1e293b;
      box-shadow: 0 2px 8px rgba(148, 163, 184, 0.55);
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
  @Input() marketReadinessTier: MarketReadinessTier = 'BRONZE';
  @Input() isAllStar = false;
  @Input() tooltip?: string;

  get badgeClass(): string {
    return this.marketReadinessTier.toLowerCase();
  }

  get label(): string {
    const star = this.isAllStar ? '⭐ ' : '';
    const tierLabels: Record<MarketReadinessTier, string> = {
      PLATINUM: '💎 Platinum',
      GOLD: '🥇 Gold',
      SILVER: '🥈 Silver',
      BRONZE: '🥉 Bronze'
    };
    return star + tierLabels[this.marketReadinessTier];
  }
}
