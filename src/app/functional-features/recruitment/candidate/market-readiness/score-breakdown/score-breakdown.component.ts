import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketReadinessCategoryBreakdown } from '../../models/goal.model';

@Component({
  selector: 'app-score-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-breakdown.component.html',
  styleUrls: ['./score-breakdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoreBreakdownComponent {
  @Input({ required: true }) categories: MarketReadinessCategoryBreakdown[] = [];

  categoryLabel(category: MarketReadinessCategoryBreakdown['category']): string {
    const labels: Record<MarketReadinessCategoryBreakdown['category'], string> = {
      PROFILE: 'Profile',
      CAREER_DEPTH: 'Career Depth',
      CERTIFICATIONS: 'Certifications',
      SKILLS: 'Skills',
      EXPERIENCE: 'Experience',
      TOTAL: 'Total'
    };
    return labels[category] ?? category;
  }

  percent(item: MarketReadinessCategoryBreakdown): number {
    if (item.maxPoints <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((item.earnedPoints / item.maxPoints) * 100));
  }
}
