import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { CandidateChallengeView, ChallengeUserStatus, ChallengeProofSubmissionRequest } from '../challenge.model';
import { ProofType } from '../../models/goal.model';

@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, TagModule, TooltipModule, ProgressBarModule],
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeCardComponent {
  @Input() set challenge(value: CandidateChallengeView) {
    this._challenge.set(value);
  }

  @Output() enrol = new EventEmitter<string>();
  @Output() submitProof = new EventEmitter<{ challengeId: string; request: ChallengeProofSubmissionRequest }>();

  readonly _challenge = signal<CandidateChallengeView | null>(null);
  readonly showProofForm = signal(false);
  proofForm: FormGroup;

  readonly proofTypes: ProofType[] = [
    ProofType.CERTIFICATE,
    ProofType.URL,
    ProofType.GITHUB_REPO,
    ProofType.PROJECT_LINK,
    ProofType.EMAIL_RECOMMENDATION
  ];

  readonly userStatus = computed<ChallengeUserStatus>(() => {
    const c = this._challenge();
    if (!c) return 'AVAILABLE';
    return c.enrolmentStatus ?? 'AVAILABLE';
  });

  readonly categoryLabel = computed(() => {
    const cat = this._challenge()?.category ?? '';
    return cat.replace('_', ' ');
  });

  readonly trackingLabel = computed(() => {
    const t = this._challenge()?.trackingType;
    return t === 'AUTO' ? 'Auto-tracked' : 'Proof required';
  });

  readonly statusSeverity = computed<'success' | 'warn' | 'info' | 'secondary'>(() => {
    switch (this.userStatus()) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'EXPIRED': return 'warn';
      default: return 'secondary';
    }
  });

  readonly statusLabel = computed(() => {
    switch (this.userStatus()) {
      case 'COMPLETED': return '✅ Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'EXPIRED': return 'Expired';
      default: return 'Available';
    }
  });

  constructor(private fb: FormBuilder) {
    this.proofForm = this.fb.group({
      proofType: [ProofType.CERTIFICATE, Validators.required],
      proofTitle: ['', Validators.required],
      proofUrl: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  onEnrol(): void {
    const id = this._challenge()?.id;
    if (id) this.enrol.emit(id);
  }

  toggleProofForm(): void {
    this.showProofForm.update(v => !v);
  }

  onSubmitProof(): void {
    if (this.proofForm.invalid) return;
    const id = this._challenge()?.id;
    if (!id) return;
    this.submitProof.emit({ challengeId: id, request: this.proofForm.value as ChallengeProofSubmissionRequest });
    this.showProofForm.set(false);
    this.proofForm.reset({ proofType: ProofType.CERTIFICATE });
  }
}
