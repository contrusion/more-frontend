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
  EXPLORATION = 'EXPLORATION',      // Exploration phase of interaction
  REPLY = 'REPLY',                 // Reply from candidate to recruiter
  FOLLOW_UP = 'FOLLOW_UP',         // Follow-up message from either party
  CV_REQUEST = 'CV_REQUEST',       // CV request from recruiter to candidate
  CV_SUBMISSION = 'CV_SUBMISSION', // CV submission from candidate to recruiter
  INTERVIEW_INVITE = 'INTERVIEW_INVITE' // Interview invitation from recruiter to candidate
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
  channel: ChannelType;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  metadata?: {
    personalizationLevel?: number;
    sourceType?: string;
    attachments?: string[];
    [key: string]: any;
  };
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
