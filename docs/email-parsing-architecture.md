# Email Parsing Integration Architecture

**Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Design Phase

## 1. System Overview

### 1.1 Objective
Automatically capture LinkedIn recruiter interactions from email notifications (Gmail/Outlook) and convert them into structured `RecruiterInteraction` and `InteractionEvent` records.

### 1.2 Key Requirements
- **OAuth Integration**: Secure Gmail API and Microsoft Graph API access
- **Historical Backfill**: Parse existing emails to build interaction history
- **Real-time Sync**: Periodic polling for new LinkedIn notifications
- **Deduplication**: Prevent duplicate events from multiple sources (email, manual entry, future browser extension)
- **Privacy**: User controls OAuth consent, can revoke access anytime
- **Resilience**: Handle API rate limits, network failures, malformed emails

### 1.3 Scope
**In Scope:**
- Gmail OAuth integration (priority)
- LinkedIn email notification parsing (InMail, connection requests, messages)
- Deduplication against existing interactions
- RESTful API for frontend integration
- User consent and OAuth token management

**Out of Scope (Future Phases):**
- Outlook/Microsoft Graph integration (Phase 2)
- Browser extension real-time capture (Phase 3)
- AI-powered sentiment analysis (Phase 4)
- Calendar integration for scheduled follow-ups (Phase 5)

---

## 2. OAuth Integration Architecture

### 2.1 Gmail OAuth 2.0 Flow

```
┌─────────────────┐                 ┌──────────────────┐                 ┌─────────────────┐
│  Angular App    │                 │  Spring Boot API │                 │  Google OAuth   │
│  (Frontend)     │                 │  (Backend)       │                 │  (Gmail API)    │
└────────┬────────┘                 └────────┬─────────┘                 └────────┬────────┘
         │                                   │                                    │
         │ 1. User clicks "Connect Gmail"   │                                    │
         │─────────────────────────────────>│                                    │
         │                                   │                                    │
         │ 2. Generate OAuth URL            │                                    │
         │   GET /api/email/gmail/auth-url  │                                    │
         │<─────────────────────────────────│                                    │
         │                                   │                                    │
         │ 3. Redirect to Google            │                                    │
         │──────────────────────────────────────────────────────────────────────>│
         │                                   │                                    │
         │                                   │  4. User grants consent            │
         │                                   │                                    │
         │ 5. Callback with auth code       │                                    │
         │   /auth/gmail/callback?code=xyz  │                                    │
         │─────────────────────────────────>│                                    │
         │                                   │                                    │
         │                                   │  6. Exchange code for tokens       │
         │                                   │  POST /oauth2/v4/token             │
         │                                   │───────────────────────────────────>│
         │                                   │                                    │
         │                                   │  7. Return access + refresh tokens │
         │                                   │<───────────────────────────────────│
         │                                   │                                    │
         │                                   │  8. Store tokens (encrypted)       │
         │                                   │      in user_email_tokens table    │
         │                                   │                                    │
         │ 9. Success response              │                                    │
         │<─────────────────────────────────│                                    │
         │                                   │                                    │
         │ 10. Navigate to sync page        │                                    │
         │   /interactions/email-sync       │                                    │
         │                                   │                                    │
```

### 2.2 Token Management

**Storage Strategy:**
- **Table:** `user_email_tokens`
- **Encryption:** AES-256 for access/refresh tokens
- **Rotation:** Refresh tokens automatically before expiry
- **Revocation:** User-triggered via UI, calls Google revoke endpoint

**Schema:**
```sql
CREATE TABLE user_email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'GMAIL', 'OUTLOOK'
    email_address VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT NOT NULL, -- Encrypted
    token_expiry TIMESTAMP NOT NULL,
    scopes TEXT[], -- ['https://www.googleapis.com/auth/gmail.readonly']
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync_at TIMESTAMP,
    UNIQUE(user_id, provider, email_address)
);

CREATE INDEX idx_user_email_tokens_user_id ON user_email_tokens(user_id);
CREATE INDEX idx_user_email_tokens_expiry ON user_email_tokens(token_expiry);
```

### 2.3 Required Scopes

**Gmail:**
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.metadata` - Email metadata (efficient filtering)

**Future - Outlook:**
- `Mail.Read` - Read user mail
- `Mail.ReadBasic` - Read basic mail properties

---

## 3. Email Parsing Pipeline

### 3.1 High-Level Flow

```
┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  Gmail API     │────> │  Email Fetcher   │────> │  Email Parser   │────> │  Interaction     │
│  (Messages)    │      │  Service         │      │  Service        │      │  Mapper Service  │
└────────────────┘      └──────────────────┘      └─────────────────┘      └──────────────────┘
                                                                                      │
                                                                                      ▼
                        ┌──────────────────┐      ┌─────────────────┐      ┌─────────────────┐
                        │  Deduplication   │<──── │  Interaction    │<──── │  Create/Update  │
                        │  Service         │      │  Service        │      │  DTOs           │
                        └──────────────────┘      └─────────────────┘      └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Database        │
                        │  (PostgreSQL)    │
                        └──────────────────┘
```

### 3.2 Email Filtering Strategy

**Query Criteria:**
```
from:(linkedin.com OR recruiter@linkedin.com) 
subject:(InMail OR "connection request" OR "sent you a message") 
after:2024-01-01
```

**Label/Folder Strategy:**
- Create Gmail label: "More/LinkedIn-Interactions"
- Auto-label parsed emails for visibility
- Prevents re-processing same emails

### 3.3 LinkedIn Email Patterns

#### Pattern 1: InMail Notification
```
From: LinkedIn Recruiter <recruiter@linkedin.com>
Subject: [Name] sent you an InMail

Body:
[Recruiter Name] | [Job Title] at [Company]
[Message preview...]
Reply on LinkedIn: [URL]
```

**Parsing Rules:**
- Extract recruiter name from email body (first line before "|")
- Extract job title and company (split by "at")
- Extract message preview (before "Reply on LinkedIn")
- Extract LinkedIn profile URL from "Reply on LinkedIn" link
- Event Type: `OUTREACH`
- Channel: `LINKEDIN`

#### Pattern 2: Connection Request
```
From: LinkedIn <invitations@linkedin.com>
Subject: [Name] wants to connect

Body:
[Recruiter Name]
[Job Title] at [Company]
[Personal note...]

View [Name]'s profile: [URL]
```

**Parsing Rules:**
- Extract recruiter name from subject line
- Extract job title and company from body
- Extract personal note (after company line)
- Extract profile URL
- Event Type: `OUTREACH`
- Channel: `LINKEDIN`

#### Pattern 3: Message Reply
```
From: LinkedIn <messages-noreply@linkedin.com>
Subject: [Name] replied to your conversation

Body:
[Recruiter Name] replied:
[Message content...]
Reply on LinkedIn: [URL]
```

**Parsing Rules:**
- Extract recruiter name from body
- Extract message content
- Event Type: `REPLY`
- Channel: `LINKEDIN`

### 3.4 Parser Implementation Strategy

**Approach:** Rule-Based + Regex Patterns

```java
public class LinkedInEmailParser {
    
    private static final Pattern INMAIL_PATTERN = Pattern.compile(
        "(?<recruiterName>.*?)\\s*\\|\\s*(?<jobTitle>.*?)\\s+at\\s+(?<company>.*?)\\n"
    );
    
    private static final Pattern PROFILE_URL_PATTERN = Pattern.compile(
        "linkedin\\.com/in/([a-zA-Z0-9-]+)"
    );
    
    public ParsedLinkedInEmail parseEmail(EmailMessage email) {
        // Determine email type from subject/sender
        EmailType type = detectEmailType(email);
        
        // Apply pattern matching based on type
        return switch (type) {
            case INMAIL -> parseInMail(email);
            case CONNECTION_REQUEST -> parseConnectionRequest(email);
            case MESSAGE_REPLY -> parseMessageReply(email);
            default -> throw new UnsupportedEmailTypeException(type);
        };
    }
}
```

---

## 4. Deduplication Strategy

### 4.1 Deduplication Dimensions

| Dimension | Key Fields | Strategy |
|-----------|-----------|----------|
| **Recruiter Identity** | LinkedIn Profile URL, Email, Name | Match by URL (primary), fallback to email |
| **Interaction Uniqueness** | Applicant + Recruiter + Timestamp Range | One interaction per recruiter-applicant pair |
| **Event Uniqueness** | Interaction + EventType + Timestamp + MessagePreview | Hash-based fingerprinting |

### 4.2 Fingerprinting Algorithm

```java
public class InteractionEventFingerprint {
    
    public String generateFingerprint(InteractionEvent event) {
        String raw = String.join("||",
            event.getInteraction().getId().toString(),
            event.getEventType().name(),
            event.getEventTimestamp().toString(),
            normalizeMessage(event.getMessagePreview()),
            event.getChannel().name()
        );
        
        return hashSHA256(raw);
    }
    
    private String normalizeMessage(String message) {
        return message == null ? "" : 
            message.trim()
                   .toLowerCase()
                   .replaceAll("\\s+", " ")
                   .substring(0, Math.min(100, message.length()));
    }
}
```

### 4.3 Deduplication Database Schema

```sql
CREATE TABLE interaction_event_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES interaction_events(id) ON DELETE CASCADE,
    fingerprint VARCHAR(64) NOT NULL UNIQUE,
    source VARCHAR(20) NOT NULL, -- 'EMAIL', 'MANUAL', 'BROWSER_EXTENSION'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fingerprints_event_id ON interaction_event_fingerprints(event_id);
CREATE INDEX idx_fingerprints_fingerprint ON interaction_event_fingerprints(fingerprint);
```

### 4.4 Deduplication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Parse email → Extract event data                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Generate fingerprint from event data                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Check if fingerprint exists in database                     │
└────────────────┬────────────────────────────┬───────────────────┘
                 │                            │
         EXISTS  │                            │  NOT EXISTS
                 ▼                            ▼
┌────────────────────────────┐   ┌──────────────────────────────┐
│  4a. Skip (log duplicate)  │   │  4b. Find/create recruiter   │
└────────────────────────────┘   └──────────┬───────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────────────┐
                                 │  5. Find/create interaction  │
                                 └──────────┬───────────────────┘
                                            │
                                            ▼
                                 ┌──────────────────────────────┐
                                 │  6. Create event + fingerprint│
                                 └──────────────────────────────┘
```

---

## 5. API Design

### 5.1 OAuth Endpoints

#### **GET** `/api/email/gmail/auth-url`
**Purpose:** Generate OAuth consent URL for Gmail integration  
**Auth:** Requires authenticated user  
**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "random-csrf-token"
}
```

#### **GET** `/api/email/gmail/callback`
**Purpose:** OAuth callback handler  
**Query Params:**
- `code`: Authorization code from Google
- `state`: CSRF token validation

**Response:** Redirect to frontend `/interactions/email-sync?status=success`

#### **DELETE** `/api/email/gmail/revoke`
**Purpose:** Revoke Gmail access and delete tokens  
**Auth:** Requires authenticated user  
**Response:**
```json
{
  "status": "revoked",
  "message": "Gmail access revoked successfully"
}
```

### 5.2 Sync Endpoints

#### **POST** `/api/email/sync/trigger`
**Purpose:** Manually trigger email sync  
**Auth:** Requires authenticated user  
**Request Body:**
```json
{
  "provider": "GMAIL",
  "syncMode": "INCREMENTAL", // or "FULL"
  "dateFrom": "2024-01-01T00:00:00Z",
  "dateTo": "2026-02-04T23:59:59Z"
}
```

**Response:**
```json
{
  "syncJobId": "uuid",
  "status": "QUEUED",
  "estimatedEmails": 1250
}
```

#### **GET** `/api/email/sync/status/{jobId}`
**Purpose:** Check sync job status  
**Response:**
```json
{
  "jobId": "uuid",
  "status": "IN_PROGRESS", // QUEUED, IN_PROGRESS, COMPLETED, FAILED
  "progress": {
    "emailsProcessed": 450,
    "emailsTotal": 1250,
    "newInteractions": 23,
    "newEvents": 67,
    "duplicatesSkipped": 15
  },
  "startedAt": "2026-02-04T10:30:00Z",
  "completedAt": null,
  "error": null
}
```

#### **GET** `/api/email/sync/history`
**Purpose:** Get user's sync history  
**Response:**
```json
{
  "connections": [
    {
      "provider": "GMAIL",
      "email": "user@gmail.com",
      "connectedAt": "2026-01-15T09:00:00Z",
      "lastSyncAt": "2026-02-04T08:00:00Z",
      "totalSyncs": 12,
      "totalEventsCreated": 234
    }
  ]
}
```

### 5.3 Configuration Endpoints

#### **GET** `/api/email/settings`
**Purpose:** Get user's email sync preferences  
**Response:**
```json
{
  "autoSync": true,
  "syncFrequency": "DAILY", // HOURLY, DAILY, WEEKLY
  "notifyOnNewInteractions": true,
  "providers": {
    "gmail": {
      "enabled": true,
      "email": "user@gmail.com"
    },
    "outlook": {
      "enabled": false,
      "email": null
    }
  }
}
```

#### **PUT** `/api/email/settings`
**Purpose:** Update email sync preferences  
**Request Body:** Same as GET response

---

## 6. Service Layer Architecture

### 6.1 Service Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                    EmailIntegrationFacade                        │
│  (Orchestrates entire email parsing workflow)                    │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ├──> GmailService (OAuth + Fetch)
             │    └──> GmailTokenService (Token management)
             │
             ├──> LinkedInEmailParser (Pattern matching)
             │
             ├──> EmailToInteractionMapper (DTO conversion)
             │
             ├──> DeduplicationService (Fingerprint checking)
             │
             └──> IInteractionService (Data persistence)
```

### 6.2 Core Services

#### **GmailService**
```java
public interface IGmailService {
    String generateAuthUrl(UUID userId);
    void handleOAuthCallback(String code, String state);
    List<EmailMessage> fetchEmails(UUID userId, EmailFetchCriteria criteria);
    void revokeAccess(UUID userId);
}
```

#### **LinkedInEmailParser**
```java
public interface ILinkedInEmailParser {
    ParsedLinkedInEmail parse(EmailMessage email);
    boolean isLinkedInEmail(EmailMessage email);
    EmailType detectEmailType(EmailMessage email);
}
```

#### **DeduplicationService**
```java
public interface IDeduplicationService {
    String generateFingerprint(InteractionEventDTO eventDTO);
    boolean isDuplicate(String fingerprint);
    void recordFingerprint(UUID eventId, String fingerprint, DataSource source);
}
```

#### **EmailIntegrationFacade**
```java
@Service
public class EmailIntegrationFacade {
    
    @Async
    public CompletableFuture<SyncJobResult> syncEmails(UUID userId, SyncRequest request) {
        // 1. Fetch emails from Gmail
        List<EmailMessage> emails = gmailService.fetchEmails(userId, request.toCriteria());
        
        // 2. Filter LinkedIn emails only
        List<EmailMessage> linkedInEmails = emails.stream()
            .filter(linkedInEmailParser::isLinkedInEmail)
            .toList();
        
        // 3. Parse and deduplicate
        List<InteractionEventDTO> events = new ArrayList<>();
        for (EmailMessage email : linkedInEmails) {
            ParsedLinkedInEmail parsed = linkedInEmailParser.parse(email);
            InteractionEventDTO eventDTO = mapper.toEventDTO(parsed);
            
            String fingerprint = deduplicationService.generateFingerprint(eventDTO);
            if (!deduplicationService.isDuplicate(fingerprint)) {
                events.add(eventDTO);
            }
        }
        
        // 4. Persist to database
        SyncJobResult result = interactionService.bulkCreateFromEmails(events);
        
        return CompletableFuture.completedFuture(result);
    }
}
```

---

## 7. Data Models

### 7.1 DTOs

#### **ParsedLinkedInEmail**
```java
@Data
@Builder
public class ParsedLinkedInEmail {
    private EmailType emailType;
    private String recruiterName;
    private String recruiterJobTitle;
    private String recruiterCompany;
    private String recruiterLinkedInUrl;
    private String recruiterEmail;
    private String messagePreview;
    private LocalDateTime emailTimestamp;
    private String gmailMessageId;
    private boolean isPersonalized;
    private boolean isUrgent;
}
```

#### **EmailFetchCriteria**
```java
@Data
@Builder
public class EmailFetchCriteria {
    private LocalDateTime dateFrom;
    private LocalDateTime dateTo;
    private int maxResults = 500;
    private String query; // Gmail query syntax
    private boolean includeBody = true;
}
```

#### **SyncJobResult**
```java
@Data
@Builder
public class SyncJobResult {
    private UUID jobId;
    private int emailsProcessed;
    private int newInteractionsCreated;
    private int newEventsCreated;
    private int duplicatesSkipped;
    private List<String> errors;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
```

### 7.2 Enums

#### **DataSource**
```java
public enum DataSource {
    EMAIL,
    MANUAL_ENTRY,
    BROWSER_EXTENSION,
    API_IMPORT
}
```

#### **EmailType**
```java
public enum EmailType {
    INMAIL,
    CONNECTION_REQUEST,
    MESSAGE_REPLY,
    JOB_APPLICATION,
    PROFILE_VIEW,
    UNKNOWN
}
```

---

## 8. Security Considerations

### 8.1 Token Security
- **Encryption:** AES-256-GCM for tokens at rest
- **Key Management:** Environment variable + AWS KMS for production
- **Access Control:** Users can only access their own tokens
- **Audit Logging:** Log all OAuth consent/revocation events

### 8.2 Rate Limiting
- **Gmail API:** 250 quota units/user/second, 1 billion/day
- **Application:** Limit sync requests to 1 per user per hour
- **Backoff Strategy:** Exponential backoff on 429 responses

### 8.3 Data Privacy
- **Minimal Data:** Only parse LinkedIn emails, ignore all other emails
- **User Consent:** Explicit OAuth consent required
- **Data Retention:** Raw email content NOT stored, only parsed metadata
- **GDPR Compliance:** Right to delete (cascade delete on user deletion)

### 8.4 CSRF Protection
- **State Parameter:** Random token stored in session, validated on callback
- **Same-Site Cookies:** Backend session cookies with SameSite=Lax

---

## 9. Error Handling

### 9.1 Error Categories

| Error Type | HTTP Status | Handling Strategy |
|------------|------------|-------------------|
| **OAuth Failed** | 401 | Prompt user to reconnect Gmail |
| **Token Expired** | 401 | Auto-refresh token, retry |
| **Rate Limited** | 429 | Queue request, retry after delay |
| **Parse Error** | 500 | Log error, skip email, continue processing |
| **Network Timeout** | 504 | Retry with exponential backoff (3 attempts) |
| **Invalid Email Format** | 422 | Log warning, skip email |

### 9.2 Resilience Patterns

**Circuit Breaker:**
```java
@CircuitBreaker(name = "gmailApi", fallbackMethod = "fallbackSync")
public List<EmailMessage> fetchEmails(UUID userId) {
    // Gmail API call
}

public List<EmailMessage> fallbackSync(UUID userId, Exception e) {
    log.error("Gmail API circuit breaker open: {}", e.getMessage());
    return Collections.emptyList();
}
```

**Retry Logic:**
```java
@Retry(name = "gmailApi", maxAttempts = 3, backoff = @Backoff(delay = 2000))
public void refreshAccessToken(UUID userId) {
    // Token refresh call
}
```

---

## 10. Future Extensibility

### 10.1 Multi-Provider Support
**Design Pattern:** Strategy Pattern for email providers

```java
public interface IEmailProviderStrategy {
    String generateAuthUrl(UUID userId);
    List<EmailMessage> fetchEmails(UUID userId, EmailFetchCriteria criteria);
}

@Component
public class GmailProviderStrategy implements IEmailProviderStrategy { }

@Component
public class OutlookProviderStrategy implements IEmailProviderStrategy { }
```

### 10.2 Browser Extension Integration
**Deduplication Key:** Browser extension will generate same fingerprints for events, ensuring no duplicates even when both sources are active.

### 10.3 AI-Powered Parsing
**Phase 4 Enhancement:** Replace regex patterns with LLM-based extraction for better accuracy with non-standard email formats.

```java
public interface IEmailParser {
    ParsedLinkedInEmail parse(EmailMessage email);
}

// Current implementation
@Primary
public class RuleBasedEmailParser implements IEmailParser { }

// Future implementation
public class LLMEmailParser implements IEmailParser {
    // Use OpenAI GPT-4 for extraction
}
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create database migrations for `user_email_tokens`, `interaction_event_fingerprints`
- [ ] Implement `GmailTokenService` with encryption
- [ ] Build OAuth flow (controller + service)
- [ ] Create frontend OAuth trigger component

### Phase 2: Email Parsing (Week 3-4)
- [ ] Implement `LinkedInEmailParser` with regex patterns
- [ ] Build `GmailService` for fetching emails
- [ ] Create `DeduplicationService` with fingerprinting
- [ ] Add unit tests for parsers (90% coverage)

### Phase 3: Integration (Week 5)
- [ ] Build `EmailIntegrationFacade` orchestration layer
- [ ] Implement async sync job processing
- [ ] Add API endpoints for sync trigger and status
- [ ] Create frontend sync status dashboard

### Phase 4: Polish (Week 6)
- [ ] Add error handling and retry logic
- [ ] Implement rate limiting
- [ ] Security audit (token encryption, CSRF)
- [ ] Performance testing (simulate 10k+ emails)

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parse Accuracy** | >95% | Manual review of 100 parsed emails |
| **Deduplication Rate** | >99% | Count duplicate fingerprint rejections |
| **Sync Performance** | <5 min for 1000 emails | Load testing |
| **OAuth Success Rate** | >98% | Track callback success/failure |
| **User Adoption** | 60% of users connect Gmail | Analytics tracking |

---

## 13. Open Questions

1. **Historical Data Limit:** How far back should initial sync go? (Propose: 1 year default, configurable)
2. **Sync Frequency:** Should we support real-time webhooks or stick with polling? (Gmail Push API requires domain verification)
3. **Email Labeling:** Should we auto-label processed emails in Gmail for user visibility?
4. **Conflict Resolution:** If manual entry exists and email arrives later, which takes precedence?
5. **Multi-Account Support:** Can users connect multiple Gmail accounts?

---

## 14. Appendix

### 14.1 Gmail API References
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Messages Resource](https://developers.google.com/gmail/api/reference/rest/v1/users.messages)
- [Rate Limits](https://developers.google.com/gmail/api/reference/quota)

### 14.2 LinkedIn Email Samples
See `docs/email-samples/` for anonymized LinkedIn email examples (InMail, connection requests, message replies)

### 14.3 Security Checklist
- [ ] Tokens encrypted at rest (AES-256-GCM)
- [ ] CSRF protection on OAuth callback
- [ ] Rate limiting on sync endpoints
- [ ] Audit logging for OAuth events
- [ ] HTTPS-only cookie transmission
- [ ] User can revoke access anytime
- [ ] Cascade delete on user deletion
