import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ChallengeService } from '../challenge.service';
import {
  ChallengeCategory,
  ChallengeRewardTrigger,
  ChallengeRewardType,
  ChallengeTrackingType,
  CreateChallengeRequest
} from '../challenge.model';

@Component({
  selector: 'app-challenge-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule,
    SelectModule, CheckboxModule, DividerModule, TooltipModule
  ],
  templateUrl: './challenge-editor.component.html',
  styleUrls: ['./challenge-editor.component.css']
})
export class ChallengeEditorComponent implements OnInit {

  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editId = signal<string | null>(null);

  readonly isEditMode = signal(false);

  form!: FormGroup;

  readonly categoryOptions: { label: string; value: ChallengeCategory }[] = [
    { label: 'Activity', value: 'ACTIVITY' },
    { label: 'Profile', value: 'PROFILE' },
    { label: 'Certification', value: 'CERTIFICATION' },
    { label: 'Skill Sprint', value: 'SKILL_SPRINT' },
    { label: 'Assessment', value: 'ASSESSMENT' }
  ];

  readonly trackingOptions: { label: string; value: ChallengeTrackingType }[] = [
    { label: 'Automatic', value: 'AUTO' },
    { label: 'Proof Required', value: 'PROOF_REQUIRED' }
  ];

  readonly rewardTypeOptions: { label: string; value: ChallengeRewardType }[] = [
    { label: 'Skip Queue Interview Invite', value: 'SKIP_QUEUE_INTERVIEW_INVITE' },
    { label: 'Visibility Boost', value: 'VISIBILITY_BOOST' },
    { label: 'Recruiter Alert', value: 'RECRUITER_ALERT' },
    { label: 'Talent Spotlight', value: 'TALENT_SPOTLIGHT' },
    { label: 'Fast Track Unlock', value: 'FAST_TRACK_UNLOCK' },
    { label: 'Badge on CV', value: 'BADGE_ON_CV' },
    { label: 'Platform Recognition', value: 'PLATFORM_RECOGNITION' }
  ];

  readonly rewardTriggerOptions: { label: string; value: ChallengeRewardTrigger }[] = [
    { label: 'On Challenge Complete', value: 'CHALLENGE_COMPLETE' },
    { label: 'On Milestone Complete', value: 'MILESTONE_N_COMPLETE' }
  ];

  constructor(
    private fb: FormBuilder,
    private challengeService: ChallengeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isEditMode.set(true);
      this.loadChallenge(id);
    }
  }

  get milestoneSteps(): FormArray {
    return this.form.get('milestoneSteps') as FormArray;
  }

  get rewards(): FormArray {
    return this.form.get('rewards') as FormArray;
  }

  buildForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: [null, Validators.required],
      durationDays: [null, [Validators.required, Validators.min(1)]],
      trackingType: [null, Validators.required],
      triggerEvent: [''],
      completionCriteria: [''],
      rewardPoints: [0, [Validators.required, Validators.min(0)]],
      allStarPoints: [0, [Validators.required, Validators.min(0)]],
      milestoneSteps: this.fb.array([]),
      rewards: this.fb.array([])
    });
  }

  loadChallenge(id: string): void {
    this.loading.set(true);
    this.challengeService.getChallengeById(id).subscribe({
      next: challenge => {
        this.form.patchValue({
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          durationDays: challenge.durationDays,
          trackingType: challenge.trackingType,
          triggerEvent: challenge.triggerEvent,
          completionCriteria: challenge.completionCriteria,
          rewardPoints: challenge.rewardPoints,
          allStarPoints: challenge.allStarPoints
        });

        challenge.milestoneSteps.forEach(step => {
          this.milestoneSteps.push(this.createStepGroup(step));
        });

        challenge.rewards.forEach(reward => {
          this.rewards.push(this.createRewardGroup(reward));
        });

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load challenge.');
        this.loading.set(false);
      }
    });
  }

  createStepGroup(step?: Partial<{ title: string; description: string | null; stepOrder: number; dueOffsetDays: number | null; linkedAssessmentId: string | null; requiresProof: boolean }>): FormGroup {
    return this.fb.group({
      title: [step?.title ?? '', Validators.required],
      description: [step?.description ?? ''],
      stepOrder: [step?.stepOrder ?? this.milestoneSteps.length + 1, Validators.required],
      dueOffsetDays: [step?.dueOffsetDays ?? null],
      linkedAssessmentId: [step?.linkedAssessmentId ?? null],
      requiresProof: [step?.requiresProof ?? false]
    });
  }

  createRewardGroup(reward?: Partial<{ rewardType: ChallengeRewardType; rewardLabel: string; triggerOn: ChallengeRewardTrigger; milestoneNumber: number | null; config: string | null }>): FormGroup {
    return this.fb.group({
      rewardType: [reward?.rewardType ?? null, Validators.required],
      rewardLabel: [reward?.rewardLabel ?? '', Validators.required],
      triggerOn: [reward?.triggerOn ?? null, Validators.required],
      milestoneNumber: [reward?.milestoneNumber ?? null],
      config: [reward?.config ?? '']
    });
  }

  addStep(): void {
    this.milestoneSteps.push(this.createStepGroup());
  }

  removeStep(index: number): void {
    this.milestoneSteps.removeAt(index);
    this.reorderSteps();
  }

  moveStep(index: number, direction: 'up' | 'down'): void {
    const steps = this.milestoneSteps;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const current = steps.at(index).value;
    const target = steps.at(targetIndex).value;
    steps.at(index).patchValue({ ...target, stepOrder: index + 1 });
    steps.at(targetIndex).patchValue({ ...current, stepOrder: targetIndex + 1 });
  }

  addReward(): void {
    this.rewards.push(this.createRewardGroup());
  }

  removeReward(index: number): void {
    this.rewards.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload = this.buildPayload();
    const id = this.editId();

    const request$ = id
      ? this.challengeService.updateChallenge(id, payload)
      : this.challengeService.createChallenge(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/challenges']);
      },
      error: () => {
        this.error.set('Failed to save challenge. Please try again.');
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/challenges']);
  }

  private buildPayload(): CreateChallengeRequest {
    const v = this.form.value;
    return {
      title: v.title,
      description: v.description || null,
      category: v.category,
      durationDays: v.durationDays,
      trackingType: v.trackingType,
      triggerEvent: v.triggerEvent || null,
      completionCriteria: v.completionCriteria || null,
      rewardPoints: v.rewardPoints,
      allStarPoints: v.allStarPoints,
      milestoneSteps: v.milestoneSteps.map((s: { title: string; description: string; stepOrder: number; dueOffsetDays: number | null; linkedAssessmentId: string | null; requiresProof: boolean }) => ({
        title: s.title,
        description: s.description || null,
        stepOrder: s.stepOrder,
        dueOffsetDays: s.dueOffsetDays,
        linkedAssessmentId: s.linkedAssessmentId || null,
        requiresProof: s.requiresProof
      })),
      rewards: v.rewards.map((r: { rewardType: ChallengeRewardType; rewardLabel: string; triggerOn: ChallengeRewardTrigger; milestoneNumber: number | null; config: string | null }) => ({
        rewardType: r.rewardType,
        rewardLabel: r.rewardLabel,
        triggerOn: r.triggerOn,
        milestoneNumber: r.milestoneNumber,
        config: r.config || null
      }))
    };
  }

  private reorderSteps(): void {
    this.milestoneSteps.controls.forEach((ctrl, i) => {
      ctrl.patchValue({ stepOrder: i + 1 });
    });
  }
}
