import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketReadinessEvent } from '../../models/goal.model';

@Component({
  selector: 'app-points-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-history.component.html',
  styleUrls: ['./points-history.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointsHistoryComponent {
  @Input({ required: true }) pointsHistory: MarketReadinessEvent[] = [];

  categoryLabel(category: MarketReadinessEvent['category']): string {
    const labels: Record<MarketReadinessEvent['category'], string> = {
      PROFILE: 'Profile',
      CAREER_DEPTH: 'Career Depth',
      CERTIFICATIONS: 'Certifications',
      SKILLS: 'Skills',
      EXPERIENCE: 'Experience',
      TOTAL: 'Total'
    };
    return labels[category] ?? category;
  }
}
