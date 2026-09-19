export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  FREELANCE = 'FREELANCE',
  TEMPORARY = 'TEMPORARY',
}

export enum ExperienceLevel {
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  JUNIOR = 'JUNIOR',
  MID_LEVEL = 'MID_LEVEL',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  EXECUTIVE = 'EXECUTIVE',
}

export enum ImportanceLevel {
  REQUIRED = 'REQUIRED',
  PREFERRED = 'PREFERRED',
  NICE_TO_HAVE = 'NICE_TO_HAVE',
}

export interface JobSkill {
  id: string;
  skillId: string;
  skillName: string;
  skillDescription?: string;
  skillCategory?: string;
  importanceLevel: ImportanceLevel;
  yearsRequired?: number;
}

export interface BenefitItem {
  id: string;
  benefitId: string;
  name: string;
  description?: string;
  category?: string;
}

export interface AvailableSkill {
  id: string;
  name: string;
  category?: string;
}

export interface AvailableBenefit {
  id: string;
  name: string;
  category?: string;
}

export interface JobAdvertisement {
  id: string;
  title: string;
  description: string;
  location: string;
  department?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  publishedDate?: string;
  closingDate: string;
  isActive: boolean;
  externalJobUrl?: string;
  applicationInstructions?: string;
  preferredCertifications: string[];
  activityRecencyDays?: number;
  skills: JobSkill[];
  benefits: BenefitItem[];
  createdAt?: string;
  updatedAt?: string;
  applicationCount?: number;
}

export interface JobApplicantListItem {
  applicantId: string;
  publicAlias: string;
  marketReadinessTier?: string;
  jobTitle?: string;
  yearsOfExperience?: number;
  status: string;
  appliedAt?: string;
  coverLetterPreview?: string;
}

export interface JobSkillRequest {
  skillId: string;
  importanceLevel: ImportanceLevel;
  yearsRequired?: number;
}

export interface JobAdvertisementCreateRequest {
  title: string;
  description: string;
  location: string;
  department?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  closingDate: string;
  isActive?: boolean;
  externalJobUrl?: string;
  applicationInstructions?: string;
  preferredCertifications: string[];
  activityRecencyDays?: number;
  skills: JobSkillRequest[];
  benefitIds: string[];
}

export interface JobAdvertisementUpdateRequest {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  department?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  closingDate?: string;
  isActive?: boolean;
  externalJobUrl?: string;
  applicationInstructions?: string;
  preferredCertifications?: string[];
  activityRecencyDays?: number;
  skills?: JobSkillRequest[];
  benefitIds?: string[];
}
