import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketReadinessNextStep } from '../../models/goal.model';

@Component({
  selector: 'app-next-steps-recommendation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './next-steps-recommendation.component.html',
  styleUrls: ['./next-steps-recommendation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextStepsRecommendationComponent {
  @Input({ required: true }) nextSteps: MarketReadinessNextStep[] = [];
}
