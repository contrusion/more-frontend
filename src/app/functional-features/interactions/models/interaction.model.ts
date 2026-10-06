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
  EXPLORATION = 'EXPLORATION',      // Exploration phase of interaction
  REPLY = 'REPLY',                 // Reply from candidate to recruiter
  FOLLOW_UP = 'FOLLOW_UP',         // Follow-up message from either party
  CV_REQUEST = 'CV_REQUEST',       // CV request from recruiter to candidate
  CV_SUBMISSION = 'CV_SUBMISSION', // CV submission from candidate to recruiter
  INTERVIEW_INVITE = 'INTERVIEW_INVITE', // Interview invitation from recruiter to candidate
  JOB_SPEC_TO_BE_SENT = 'JOB_SPEC_TO_BE_SENT', // Recruiter will send the job spec if needed
  JOB_SPEC_ATTACHED = 'JOB_SPEC_ATTACHED', // Job spec has been sent (attached or written out)
  INQUIRY = 'INQUIRY', // Compensation, visa, location, or similar inquiry
  COMPENSATION_INQUIRY = 'COMPENSATION_INQUIRY', // Salary, package, or rate question
  VISA_INQUIRY = 'VISA_INQUIRY', // Visa or sponsorship question
  LOCATION_INQUIRY = 'LOCATION_INQUIRY', // Remote, hybrid, commute, or relocation question
  NOTICE_PERIOD_INQUIRY = 'NOTICE_PERIOD_INQUIRY', // Notice period or start date question
  AVAILABILITY_INQUIRY = 'AVAILABILITY_INQUIRY', // Calendar or interview availability question
  BENEFITS_INQUIRY = 'BENEFITS_INQUIRY', // Benefits, leave, or perks question
  INTERESTED = 'INTERESTED', // Sender explicitly expressed their own interest
  NOT_INTERESTED = 'NOT_INTERESTED', // Candidate is not interested
  REJECTION = 'REJECTION' // Candidate or recruiter rejected the process
}

export enum InteractionStatus {
  NEW = 'NEW',         // Recently created interaction with no response yet
  ACTIVE = 'ACTIVE',   // Ongoing interaction with recent activity
  STALE = 'STALE',     // No activity for a defined period
  CLOSED = 'CLOSED'    // Interaction has reached a conclusion
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
