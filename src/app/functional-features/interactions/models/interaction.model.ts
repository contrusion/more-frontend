export enum ChannelType {
  MO_NATIVE = 'MO_NATIVE',
  EMAIL = 'EMAIL',
  LINKEDIN = 'LINKEDIN',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  IN_PERSON = 'IN_PERSON',
  VIDEO_CALL = 'VIDEO_CALL',
  TEXT_MESSAGE = 'TEXT_MESSAGE',
  OTHER = 'OTHER'
}

export enum EventType {
  OUTREACH = 'OUTREACH',           // Initial contact from recruiter
  PENDING_CLASSIFICATION = 'PENDING_CLASSIFICATION', // Live Gmail message not yet classified by sync pipeline
  UNKNOWN = 'UNKNOWN', // Model returned a label outside the published taxonomy; awaiting admin review
  REPLY = 'REPLY',                 // Reply from candidate to recruiter
  FOLLOW_UP = 'FOLLOW_UP',         // Follow-up message from either party
  CV_REQUEST = 'CV_REQUEST',       // CV request from recruiter to candidate
  CV_SUBMITTED = 'CV_SUBMITTED', // CV submission from candidate to recruiter
  SCREENING_ASSESSMENT_REQUEST = 'SCREENING_ASSESSMENT_REQUEST', // Recruiter requested a screening assessment
  SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT = 'SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT', // Screening assessment acknowledgement or completion confirmation
  SCREENING_ASSESSMENT_SCHEDULED = 'SCREENING_ASSESSMENT_SCHEDULED', // Screening assessment scheduled
  SCREENING_ASSESSMENT_COMPLETED = 'SCREENING_ASSESSMENT_COMPLETED', // Screening assessment completed
  SCREENING_ASSESSMENT_PASSED = 'SCREENING_ASSESSMENT_PASSED', // Screening assessment passed successfully
  SCREENING_ASSESSMENT_FAILED = 'SCREENING_ASSESSMENT_FAILED', // Screening assessment failed or did not pass
  INTERVIEW_TIME_PROPOSED = 'INTERVIEW_TIME_PROPOSED', // Interview time proposed
  INTERVIEW_TIME_PROPOSED_REJECTED = 'INTERVIEW_TIME_PROPOSED_REJECTED', // Proposed interview time was rejected
  INTERVIEW_TIME_ACCEPTED = 'INTERVIEW_TIME_ACCEPTED', // Interview time accepted
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', // Interview scheduled or confirmed
  INTERVIEW_INVITE = 'INTERVIEW_INVITE', // Interview invitation from recruiter to candidate
  JOB_SPEC_REQUEST = 'JOB_SPEC_REQUEST', // Candidate asks for the job specification details
  JOB_SPEC_WRITTEN_IN_MAIL_TEXT = 'JOB_SPEC_WRITTEN_IN_MAIL_TEXT', // Recruiter writes or pastes job specification details in the email body
  JOB_SPEC_REVIEWED = 'JOB_SPEC_REVIEWED', // Candidate reviewed the job spec and is evaluating fit
  JOB_SPEC_TO_BE_SENT = 'JOB_SPEC_TO_BE_SENT', // Recruiter will send the job spec if needed
  JOB_SPEC_ATTACHED = 'JOB_SPEC_ATTACHED', // Job spec has been sent (attached or written out)
  INQUIRY = 'INQUIRY', // Compensation, visa, location, or similar inquiry
  SKILLS_INQUIRY = 'SKILLS_INQUIRY', // Skill requirement inquiry
  SKILLS_GAP = 'SKILLS_GAP', // Candidate skill mismatch or missing required skills
  COMPENSATION_INQUIRY = 'COMPENSATION_INQUIRY', // Salary, package, or rate question
  COMPENSATION_BOTTLENECK = 'COMPENSATION_BOTTLENECK', // Compensation package or expectation mismatch is blocking progress
  COMPENSATION_NEEDS_MET = 'COMPENSATION_NEEDS_MET', // Compensation expectations aligned
  VISA_INQUIRY = 'VISA_INQUIRY', // Visa or sponsorship question
  LOCATION_INQUIRY = 'LOCATION_INQUIRY', // Remote, hybrid, commute, or relocation question
  LOCATION_BOTTLENECK = 'LOCATION_BOTTLENECK', // Location, remote, or relocation constraints are blocking progress
  LOCATION_NEEDS_MET = 'LOCATION_NEEDS_MET', // Location expectations aligned
  NOTICE_PERIOD_INQUIRY = 'NOTICE_PERIOD_INQUIRY', // Notice period or start date question
  AVAILABILITY_INQUIRY = 'AVAILABILITY_INQUIRY', // Calendar or interview availability question
  BENEFITS_INQUIRY = 'BENEFITS_INQUIRY', // Benefits, leave, or perks question
  INTERESTED = 'INTERESTED', // Candidate explicitly expressed their own interest
  INTEREST_CHECK = 'INTEREST_CHECK', // Recruiter asked whether the candidate is interested
  ACKNOWLEDGEMENT = 'ACKNOWLEDGEMENT', // Receipt confirmed (e.g. thanks for sending your CV)
  NOT_INTERESTED = 'NOT_INTERESTED', // Candidate is not interested
  REJECTION = 'REJECTION', // Candidate or recruiter rejected the process
  RECRUITEMENT_PROCESS_UPDATE = 'RECRUITEMENT_PROCESS_UPDATE' // A status update or process change in the recruitment workflow
}

export enum InteractionStatus {
  NEW = 'NEW',         // Recently created interaction with no response yet
  ACTIVE = 'ACTIVE',   // Ongoing interaction with recent activity
  STALE = 'STALE',     // No activity for a defined period
  CLOSED = 'CLOSED'    // Interaction has reached a conclusion
}

/** Decision-relevant facts about one opportunity, as stated in one email. Every scalar is optional. */
export interface OpportunityFacts {
  skills: string[];
  location?: string;
  workMode?: string;
  salary?: string;
  visaConstraints?: string;
  noticePeriod?: string;
  interviewDate?: string;
  dealBreakers: string[];
}

/** A client opportunity extracted from a recruiter email (never the recruiter's own company). */
export interface EventOpportunity {
  companyId?: string;
  companyName?: string;
  /** Only present when the website was stated in the email and verified server-side. */
  companyWebsite?: string;
  title?: string;
  facts: OpportunityFacts;
}

/** One distinct opportunity in a thread, merged across the thread's emails. */
export interface ThreadOpportunity extends EventOpportunity {
  /** Time of the newest email that mentioned this opportunity. */
  lastSeen: Date;
}

export interface InteractionEvent {
  id: string;
  interactionThreadId: string;
  eventType: EventType;
  additionalEventTypes?: EventType[];
  channel: ChannelType;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  threadId?: string;
  subject?: string;
  opportunities?: EventOpportunity[];
  metadata?: {
    personalizationLevel?: number;
    sourceType?: string;
    attachments?: string[];
    [key: string]: any;
  };
}

export interface EmailThreadMessage {
  messageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  sentAt: Date;
  fromUser: boolean;
  eventType?: EventType;
  additionalEventTypes?: EventType[];
  persistedClassification?: boolean;
}

export interface InteractionThread {
  id: string;
  participantId: string; // The other person (recruiter or applicant)
  participantName: string;
  participantRole: 'RECRUITER' | 'APPLICANT';
  participantAvatar?: string;
  companyName?: string;
  jobAdvertId?: string; // Optional - may be exploratory
  jobTitle?: string;
  /** Client opportunities extracted from the thread's emails, most recently mentioned first. */
  opportunities?: ThreadOpportunity[];
  status: InteractionStatus;
  lastEventDate: Date;
  lastEventPreview: string;
  unreadCount: number;
  events: InteractionEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  interactionThreadId?: string; // Optional - create new thread if not provided
  participantId?: string; // Required if creating new thread
  participantName?: string; // Required if creating new thread
  eventType: EventType;
  channel: ChannelType;
  content: string;
  jobAdvertId?: string;
  metadata?: any;
}
