export interface JobFeedItem {
  id: string;
  title: string;
  location: string;
  department?: string;
  jobType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  closingDate: string;
  companyName: string;
  skillNames: string[];
  preferredCertifications: string[];
  alreadyApplied: boolean;
  applicationStatus?: string;
  matchThreshold?: number;
  careerPathwayWatched?: boolean;
  matchScore?: number;
  matchDetails?: string;
}

export interface MyApplication {
  id: string;
  jobAdvertisementId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  coverLetter?: string;
  status: string;
  appliedAt: string;
  lastStatusChange: string;
}

export interface ApplyRequest {
  coverLetter?: string;
}

export type WatchRequestDecision = 'ACCEPT' | 'DECLINE';

export interface CandidateWatchRequest {
  id: string;
  candidateAlias: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  triggerReason: 'SKILL_GAP' | 'EXPERIENCE_GAP' | 'TIMING_GAP' | 'DOMAIN_GAP';
  recruiterNote: string | null;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

export interface RespondToWatchRequestPayload {
  decision: WatchRequestDecision;
}
