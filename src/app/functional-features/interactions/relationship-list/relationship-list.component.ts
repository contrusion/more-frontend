import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../../none-functional-features/authentication-and-authorization/services/auth.service';

@Component({
  selector: 'app-relationship-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relationship-list.component.html',
  styleUrls: ['./relationship-list.component.css']
})
export class RelationshipListComponent {
  constructor(private authService: AuthService) {}

  get title(): string {
    return this.isApplicantMode() ? 'My Recruiters' : 'My Candidates';
  }

  get description(): string {
    return this.isApplicantMode()
      ? 'Keep track of the recruiters you are actively engaging with.'
      : 'Keep track of the candidates you are actively supporting or reviewing.';
  }

  get emptyStateMessage(): string {
    return this.isApplicantMode()
      ? 'You do not have any recruiter relationships yet.'
      : 'You do not have any candidate relationships yet.';
  }

  isApplicantMode(): boolean {
    return this.authService.hasRole('APPLICANT');
  }
}
