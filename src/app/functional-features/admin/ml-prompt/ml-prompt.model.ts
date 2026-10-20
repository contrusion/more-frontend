export type MlPromptSectionType =
  | 'INSTRUCTION'
  | 'RULES'
  | 'OUTPUT_FORMAT'
  | 'FIELD_SPECS'
  | 'LABEL_TYPES'
  | 'LABEL_BOUNDARIES'
  | 'HIERARCHY';

export type MlUnknownStatus = 'NEW' | 'REVIEWED' | 'DISMISSED';

export interface MlPromptItem {
  id: string;
  title: string | null;
  content: string;
  sortOrder: number;
  active: boolean;
}

export interface MlPromptSection {
  id: string;
  type: MlPromptSectionType;
  supportsItems: boolean;
  heading: string | null;
  intro: string | null;
  items: MlPromptItem[];
}

export interface MlLabelGroup {
  id: string;
  name: string;
  intro: string | null;
  sortOrder: number;
}

export interface MlEventLabel {
  id: string;
  name: string;
  displayName: string;
  groupId: string;
  groupName: string;
  definition: string;
  priority: number;
  sortOrder: number;
  active: boolean;
  aliases: string[];
  /** False when no constant of the backend enum InteractionEventType has this name, so the label cannot be published. */
  codeSupported: boolean;
}

export interface MlPromptDraft {
  sections: MlPromptSection[];
  groups: MlLabelGroup[];
  labels: MlEventLabel[];
}

export interface MlPromptStatus {
  publishedVersion: number | null;
  runningVersion: number | null;
  unpublishedChanges: boolean;
  restartPending: boolean;
  validationErrors: string[];
}

export interface MlPromptPreview {
  prompt: string;
  validationErrors: string[];
}

export interface MlPromptVersion {
  id: string;
  versionNumber: number;
  note: string | null;
  publishedBy: string | null;
  publishedAt: string;
  running: boolean;
  renderedPrompt: string | null;
}

export interface MlPromptSectionUpdateRequest {
  heading: string | null;
  intro: string | null;
}

export interface MlPromptItemRequest {
  title: string | null;
  content: string;
  active: boolean;
}

export interface MlLabelGroupRequest {
  name: string;
  intro: string | null;
}

export interface MlEventLabelRequest {
  name: string;
  displayName: string;
  groupId: string;
  definition: string;
  active: boolean;
  aliases: string[];
}

export interface MlUnknownClassification {
  id: string;
  messageId: string;
  interactionEventId: string | null;
  sourceProvider: string | null;
  subject: string | null;
  messageText: string | null;
  rawEventType: string | null;
  rawAdditionalEventTypes: string[];
  unknownLabels: string[];
  modelReason: string | null;
  unknownCause: string;
  confidence: number | null;
  promptVersion: number | null;
  status: MlUnknownStatus;
  createdAt: string;
  expiresAt: string;
  daysRemaining: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface MlUnknownSummary {
  unreviewedCount: number;
}

export interface MlUnknownPage {
  content: MlUnknownClassification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
