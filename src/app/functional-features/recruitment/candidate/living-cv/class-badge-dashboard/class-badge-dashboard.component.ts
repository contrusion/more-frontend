import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateClassBadgeComponent } from '../../../../../shared/components/candidate-class-badge/candidate-class-badge.component';
import { CandidateClass } from '../../models/goal.model';

interface ClassConfig {
  motivationalMessage: string;
  nextStep: string;
  accentClass: string;  // CSS modifier
}

@Component({
  selector: 'app-class-badge-dashboard',
  standalone: true,
  imports: [CommonModule, CandidateClassBadgeComponent],
  templateUrl: './class-badge-dashboard.component.html',
  styleUrls: ['./class-badge-dashboard.component.css']
})
export class ClassBadgeDashboardComponent {
  @Input({ required: true }) candidateClass!: CandidateClass;
  @Input({ required: true }) publicAlias!: string;

  private readonly configs: Record<CandidateClass, ClassConfig> = {
    ALL_STAR: {
      motivationalMessage:
        "You're All-Star: recruiters see you as actively growing and deeply experienced. You're at the very top of the talent pool.",
      nextStep:
        'Keep logging new goals and proof items to maintain your elite status.',
      accentClass: 'accent--all-star',
    },
    GOLD: {
      motivationalMessage:
        "You've reached Gold: recruiters see you as career-proven or actively growing. You're a trusted candidate.",
      nextStep:
        'Add more proof items or update goals regularly to aim for All-Star.',
      accentClass: 'accent--gold',
    },
    SILVER: {
      motivationalMessage:
        "You're Silver: recruiters see you as developing your profile. You're building momentum.",
      nextStep:
        'Log at least one new goal and proof item this month to move up to Gold.',
      accentClass: 'accent--silver',
    },
    BRONZE: {
      motivationalMessage:
        "You're Bronze: recruiters see you as early-stage or currently inactive. This is your starting point.",
      nextStep:
        'Add proof items and set goals to climb into Silver and beyond.',
      accentClass: 'accent--bronze',
    },
  };

  get config(): ClassConfig {
    return this.configs[this.candidateClass];
  }
}
