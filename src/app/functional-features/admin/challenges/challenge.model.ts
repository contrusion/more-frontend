export type ChallengeCategory = 'ACTIVITY' | 'PROFILE' | 'CERTIFICATION' | 'SKILL_SPRINT' | 'ASSESSMENT';

export type ChallengeTrackingType = 'AUTO' | 'PROOF_REQUIRED';

export type ChallengeStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

export type ChallengeRewardType =
  | 'SKIP_QUEUE_INTERVIEW_INVITE'
  | 'VISIBILITY_BOOST'
  | 'RECRUITER_ALERT'
  | 'TALENT_SPOTLIGHT'
  | 'FAST_TRACK_UNLOCK'
  | 'BADGE_ON_CV'
  | 'PLATFORM_RECOGNITION';

export type ChallengeRewardTrigger = 'CHALLENGE_COMPLETE' | 'MILESTONE_N_COMPLETE';

export interface ChallengeMilestoneStep {
  id: string;
  title: string;
  description: string | null;
  stepOrder: number;
  dueOffsetDays: number | null;
  linkedAssessmentId: string | null;
  requiresProof: boolean;
}

export interface ChallengeReward {
  id: string;
  rewardType: ChallengeRewardType;
  rewardLabel: string;
  triggerOn: ChallengeRewardTrigger;
  milestoneNumber: number | null;
  config: string | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: ChallengeCategory;
  durationDays: number;
  trackingType: ChallengeTrackingType;
  triggerEvent: string | null;
  completionCriteria: string | null;
  rewardPoints: number;
  allStarPoints: number;
  status: ChallengeStatus;
  active: boolean;
  milestoneSteps: ChallengeMilestoneStep[];
  rewards: ChallengeReward[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengeRequest {
  title: string;
  description: string | null;
  category: ChallengeCategory;
  durationDays: number;
  trackingType: ChallengeTrackingType;
  triggerEvent: string | null;
  completionCriteria: string | null;
  rewardPoints: number;
  allStarPoints: number;
  milestoneSteps: CreateChallengeMilestoneStepRequest[];
  rewards: CreateChallengeRewardRequest[];
}

export interface CreateChallengeMilestoneStepRequest {
  title: string;
  description: string | null;
  stepOrder: number;
  dueOffsetDays: number | null;
  linkedAssessmentId: string | null;
  requiresProof: boolean;
}

export interface CreateChallengeRewardRequest {
  rewardType: ChallengeRewardType;
  rewardLabel: string;
  triggerOn: ChallengeRewardTrigger;
  milestoneNumber: number | null;
  config: string | null;
}

export interface UpdateChallengeRequest extends CreateChallengeRequest {}

export interface ChallengeStatusUpdateRequest {
  status: ChallengeStatus;
}

export interface ChallengeStats {
  challengeId: string;
  totalEnrolments: number;
  completedEnrolments: number;
  completionRate: number;
  avgDaysToComplete: number | null;
  activeEnrolments: number;
}

export interface ChallengeImportRowResult {
  rowNumber: number;
  success: boolean;
  title: string;
  challengeId: string | null;
  error: string | null;
}

export interface ChallengeImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  rows: ChallengeImportRowResult[];
}
