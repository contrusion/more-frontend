import { ChallengeCategory, ChallengeTrackingType, ChallengeMilestoneStep } from '../../../admin/challenges/challenge.model';
import { ProofType, VerificationStatus } from '../models/goal.model';

export type CandidateEnrolmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

/** AVAILABLE means no enrolment record yet (enrolmentStatus is null from backend) */
export type ChallengeUserStatus = 'AVAILABLE' | CandidateEnrolmentStatus;

/**
 * Combined view: challenge details + current candidate's enrolment state.
 * enrolmentStatus null → candidate has not yet enrolled (AVAILABLE).
 */
export interface CandidateChallengeView {
  id: string;
  title: string;
  description: string | null;
  category: ChallengeCategory;
  durationDays: number;
  trackingType: ChallengeTrackingType;
  completionCriteria: string | null;
  rewardPoints: number;
  allStarPoints: number;
  milestoneSteps: ChallengeMilestoneStep[];
  // Enrolment state — null means AVAILABLE
  enrolmentId: string | null;
  enrolmentStatus: CandidateEnrolmentStatus | null;
  progressSnapshot: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
  pointsAwarded: number;
  // Proof details
  proofUrl: string | null;
  proofTitle: string | null;
  proofType: ProofType | null;
  proofVerificationStatus: VerificationStatus | null;
}

export interface ChallengeProofSubmissionRequest {
  proofType: ProofType;
  proofTitle: string;
  proofUrl: string;
}
