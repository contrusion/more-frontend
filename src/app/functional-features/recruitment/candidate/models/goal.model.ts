export enum GoalCategory {
  SKILL = 'SKILL',
  CERTIFICATION = 'CERTIFICATION',
  PROJECT = 'PROJECT',
  LANGUAGE = 'LANGUAGE',
  OTHER = 'OTHER'
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export enum ProofType {
  CERTIFICATE = 'CERTIFICATE',
  URL = 'URL',
  GITHUB_REPO = 'GITHUB_REPO',
  PROJECT_LINK = 'PROJECT_LINK',
  EMAIL_RECOMMENDATION = 'EMAIL_RECOMMENDATION'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface CandidateGoal {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  targetDate: string | null; // ISO date string
  status: GoalStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  milestoneCount: number;
  completedMilestoneCount: number;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate?: string;
  isPublic?: boolean;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: GoalCategory;
  targetDate?: string;
  status?: GoalStatus;
  isPublic?: boolean;
}

export interface MilestoneProofItem {
  id: string;
  milestoneId: string;
  type: ProofType;
  title: string;
  url: string | null;
  uploadedAt: string;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  completionPercentage: number;
  completedAt: string;
  proofItems: MilestoneProofItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  completionPercentage: number;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  completionPercentage?: number;
}

export interface CreateProofItemRequest {
  type: ProofType;
  title: string;
  url?: string;
  isPublic?: boolean;
}

// ---- Living CV (US 1.3) ----

export type CandidateClass = 'GOLD' | 'SILVER' | 'BRONZE';

export interface ProfileSummary {
  firstName: string;
  lastName: string;
  jobTitle: string;
  industry: string;
  biography: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  profileImageUrl: string | null;
}

export interface LivingCvGoal {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  targetDate: string | null;
  status: GoalStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  milestones: GoalMilestone[];
}

export interface LivingCvStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  notStartedGoals: number;
  abandonedGoals: number;
  totalMilestones: number;
  totalProofItems: number;
  verifiedProofItems: number;
}

export interface LivingCv {
  profile: ProfileSummary;
  candidateClass: CandidateClass;
  goals: LivingCvGoal[];
  workExperience: WorkExperience[];
  education: Education[];
  skills: CandidateSkill[];
  certifications: Certification[];
  references: CandidateReference[];
  stats: LivingCvStats;
  lastUpdated: string | null;
}

// ---- Work Experience ----

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: EmploymentType | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  location: string | null;
  description: string | null;
  includeInCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkExperienceRequest {
  companyName: string;
  jobTitle: string;
  employmentType?: EmploymentType;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  description?: string;
  includeInCv?: boolean;
}

export interface UpdateWorkExperienceRequest {
  companyName?: string;
  jobTitle?: string;
  employmentType?: EmploymentType;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  description?: string;
  includeInCv?: boolean;
}

// ---- Education ----

export interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  grade: string | null;
  description: string | null;
  includeInCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEducationRequest {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  grade?: string;
  description?: string;
  includeInCv?: boolean;
}

export interface UpdateEducationRequest {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  grade?: string;
  description?: string;
  includeInCv?: boolean;
}

// ---- Certifications ----

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  includeInCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationRequest {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  includeInCv?: boolean;
}

export interface UpdateCertificationRequest {
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  includeInCv?: boolean;
}

// ---- References ----

export type ReferenceRelationship = 'MANAGER' | 'COLLEAGUE' | 'MENTOR' | 'CLIENT' | 'OTHER';

export interface CandidateReference {
  id: string;
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string | null;
  relationship: ReferenceRelationship;
  includeInCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateReferenceRequest {
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone?: string;
  relationship: ReferenceRelationship;
  includeInCv?: boolean;
}

export interface UpdateCandidateReferenceRequest {
  fullName?: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: ReferenceRelationship;
  includeInCv?: boolean;
}

// ---- Skills ----

export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface CandidateSkill {
  id: string;
  skillId: string;
  skillName: string;
  skillCategory: string | null;
  proficiencyLevel: ProficiencyLevel;
  yearsExperience: number | null;
  isVerified: boolean;
  endorsementCount: number;
  includeInCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddSkillRequest {
  skillId: string;
  proficiencyLevel: ProficiencyLevel;
  yearsExperience?: number;
  includeInCv?: boolean;
}

export interface UpdateSkillRequest {
  proficiencyLevel?: ProficiencyLevel;
  yearsExperience?: number;
  includeInCv?: boolean;
}

