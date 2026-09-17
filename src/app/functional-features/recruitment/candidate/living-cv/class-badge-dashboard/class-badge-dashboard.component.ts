import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateClassBadgeComponent } from '../../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { MarketReadinessTier } from '../../models/goal.model';

interface ClassConfig {
  motivationalMessage: string;
  nextStep: string;
  accentClass: string;
}

@Component({
  selector: 'app-class-badge-dashboard',
  standalone: true,
  imports: [CommonModule, CandidateClassBadgeComponent],
  templateUrl: './class-badge-dashboard.component.html',
  styleUrls: ['./class-badge-dashboard.component.css']
})
export class ClassBadgeDashboardComponent {
  @Input({ required: true }) marketReadinessTier!: MarketReadinessTier;
  @Input() isAllStar = false;
  @Input({ required: true }) publicAlias!: string;

  private readonly configs: Record<MarketReadinessTier, ClassConfig> = {
    PLATINUM: {
      motivationalMessage:
        "You've reached Platinum: recruiters see you as an elite, market-ready professional with deep career proof. You're at the very top of the talent pool.",
      nextStep:
        'Maintain your certifications and keep your profile fresh to stay at Platinum.',
      accentClass: 'accent--platinum',
    },
    GOLD: {
      motivationalMessage:
        "You've reached Gold: recruiters see you as highly market-ready with strong experience and skills. You're a trusted candidate.",
      nextStep:
        'Add more certifications or years of experience proof to aim for Platinum.',
      accentClass: 'accent--gold',
    },
    SILVER: {
      motivationalMessage:
        "You're Silver: recruiters see you as actively building your market readiness. You're making solid progress.",
      nextStep:
        'Add certifications and expand your skills portfolio to move up to Gold.',
      accentClass: 'accent--silver',
    },
    BRONZE: {
      motivationalMessage:
        "You're Bronze: recruiters see you as early-stage. This is your starting point on the journey to market readiness.",
      nextStep:
        'Fill in your work experience and add skills to climb into Silver and beyond.',
      accentClass: 'accent--bronze',
    },
  };

  get config(): ClassConfig {
    return this.configs[this.marketReadinessTier];
  }
}
