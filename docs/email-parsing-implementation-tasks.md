# Email Parsing Implementation Tasks

**Architecture Reference:** [email-parsing-architecture.md](./email-parsing-architecture.md)  
**Status:** Ready for Implementation  
**Estimated Duration:** 6 weeks

---

## Phase 1: Database & Foundation (Week 1-2)

### Task 1.1: Database Migrations ⏳
**Location:** `more-api/src/main/resources/db/migration/`

- [ ] Create `V{next}_create_user_email_tokens_table.sql`
  - Columns: id, user_id, provider, email_address, access_token, refresh_token, token_expiry, scopes, created_at, updated_at, last_sync_at
  - Indexes: user_id, token_expiry
  - Constraint: UNIQUE(user_id, provider, email_address)

- [ ] Create `V{next}_create_interaction_event_fingerprints_table.sql`
  - Columns: id, event_id, fingerprint, source, created_at
  - Indexes: event_id, fingerprint (UNIQUE)
  - Foreign key: event_id → interaction_events(id) ON DELETE CASCADE

- [ ] Run migrations locally and verify schema

**Dependencies:** None  
**Verification:** `SELECT * FROM user_email_tokens LIMIT 0;` returns empty result

---

### Task 1.2: Encryption Service 🔐
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Create `IEncryptionService` interface
  ```java
  String encrypt(String plaintext);
  String decrypt(String ciphertext);
  ```

- [ ] Create `AESEncryptionService` implementation
  - Use AES-256-GCM mode
  - Read encryption key from environment variable `EMAIL_TOKEN_ENCRYPTION_KEY`
  - Add initialization vector (IV) handling
  - Add unit tests for encrypt/decrypt roundtrip

- [ ] Add key generation script to README
  ```bash
  openssl rand -base64 32
  ```

**Dependencies:** Task 1.1  
**Verification:** Unit test encrypts "hello" and decrypts back to "hello"

---

### Task 1.3: User Email Token Entity 📦
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/domain/`

- [ ] Create `UserEmailToken` entity
  - Fields match migration schema
  - `@Enumerated` for provider (EmailProvider enum)
  - `@Convert` for encrypting access_token/refresh_token fields
  - Lombok `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`

- [ ] Create `EmailProvider` enum
  ```java
  public enum EmailProvider {
      GMAIL,
      OUTLOOK  // Future
  }
  ```

- [ ] Create repository: `IUserEmailTokenRepository extends JpaRepository`
  ```java
  Optional<UserEmailToken> findByUserIdAndProvider(UUID userId, EmailProvider provider);
  List<UserEmailToken> findByTokenExpiryBefore(LocalDateTime threshold);
  ```

**Dependencies:** Task 1.2  
**Verification:** Create token entity in test, verify tokens are encrypted in DB

---

### Task 1.4: Interaction Event Fingerprint Entity 📦
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/domain/`

- [ ] Create `InteractionEventFingerprint` entity
  - Fields: id, eventId, fingerprint, source, createdAt
  - `@Enumerated` for DataSource enum

- [ ] Create `DataSource` enum
  ```java
  public enum DataSource {
      EMAIL,
      MANUAL_ENTRY,
      BROWSER_EXTENSION,
      API_IMPORT
  }
  ```

- [ ] Create repository: `IInteractionEventFingerprintRepository`
  ```java
  boolean existsByFingerprint(String fingerprint);
  Optional<InteractionEventFingerprint> findByFingerprint(String fingerprint);
  ```

**Dependencies:** Task 1.3  
**Verification:** Save fingerprint, verify `existsByFingerprint` returns true

---

## Phase 2: OAuth Integration (Week 2-3)

### Task 2.1: Gmail OAuth Configuration 🔑
**Location:** `more-api/src/main/resources/application.yml`

- [ ] Add Gmail OAuth properties
  ```yaml
  google:
    oauth:
      client-id: ${GOOGLE_CLIENT_ID}
      client-secret: ${GOOGLE_CLIENT_SECRET}
      redirect-uri: ${BACKEND_URL}/api/email/gmail/callback
      scopes:
        - https://www.googleapis.com/auth/gmail.readonly
        - https://www.googleapis.com/auth/gmail.metadata
  ```

- [ ] Create Google Cloud Project
  - Enable Gmail API
  - Create OAuth 2.0 credentials
  - Add authorized redirect URIs: `http://localhost:8080/api/email/gmail/callback`

- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

**Dependencies:** None  
**Verification:** Application starts without config errors

---

### Task 2.2: Gmail Token Service 🎫
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Create `IGmailTokenService` interface
  ```java
  String generateAuthUrl(UUID userId);
  void saveTokens(UUID userId, String accessToken, String refreshToken, int expiresIn);
  String getValidAccessToken(UUID userId); // Auto-refreshes if expired
  void revokeTokens(UUID userId);
  ```

- [ ] Create `GmailTokenService` implementation
  - Use Google OAuth client library
  - Generate auth URL with state parameter (store in session or Redis)
  - Handle token exchange after OAuth callback
  - Auto-refresh logic: check expiry, call refresh endpoint if < 10 min remaining
  - Call Google revoke endpoint on user request

- [ ] Add unit tests using Mockito
  - Test auth URL generation
  - Test token refresh logic
  - Test token revocation

**Dependencies:** Task 1.3, Task 2.1  
**Verification:** `generateAuthUrl()` returns valid Google OAuth URL

---

### Task 2.3: Email Controller - OAuth Endpoints 🎮
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/controllers/`

- [ ] Create `EmailController`
  ```java
  @RestController
  @RequestMapping("/api/email")
  public class EmailController {
      
      @GetMapping("/gmail/auth-url")
      public ResponseEntity<AuthUrlResponse> getGmailAuthUrl();
      
      @GetMapping("/gmail/callback")
      public RedirectView handleGmailCallback(@RequestParam String code, @RequestParam String state);
      
      @DeleteMapping("/gmail/revoke")
      public ResponseEntity<Void> revokeGmailAccess();
  }
  ```

- [ ] Implement OAuth flow
  - Validate state parameter in callback
  - Exchange code for tokens via `GmailTokenService`
  - Redirect to frontend: `http://localhost:4200/interactions/email-sync?status=success`
  - Handle errors: redirect with `?status=error&message=...`

- [ ] Add integration tests
  - Test auth URL endpoint
  - Test callback with valid/invalid state
  - Test revoke endpoint

**Dependencies:** Task 2.2  
**Verification:** Postman test `GET /api/email/gmail/auth-url` returns auth URL

---

### Task 2.4: Frontend - OAuth Trigger Component 🖥️
**Location:** `more-frontend/src/app/functional-features/interactions/email-sync/`

- [ ] Create `email-sync.component.ts/html/css`
  - "Connect Gmail" button
  - Show loading state during OAuth flow
  - Display connected email and last sync time
  - "Disconnect" button (calls revoke endpoint)

- [ ] Add component to routing
  ```typescript
  {
    path: 'email-sync',
    component: EmailSyncComponent
  }
  ```

- [ ] Add navigation link in interactions-layout.component.ts
  - Icon: `<i class="bi bi-envelope-at"></i>`
  - Label: "Email Sync"

- [ ] Implement OAuth flow
  - Call `GET /api/email/gmail/auth-url`
  - Open OAuth URL in popup window (use `window.open`)
  - Listen for `message` event from popup with OAuth result
  - Update UI on success/failure

**Dependencies:** Task 2.3  
**Verification:** Click "Connect Gmail" opens Google consent screen

---

## Phase 3: Email Parsing (Week 3-4)

### Task 3.1: Gmail Service - Fetch Emails 📧
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Add Gmail API dependency to `pom.xml`
  ```xml
  <dependency>
      <groupId>com.google.apis</groupId>
      <artifactId>google-api-services-gmail</artifactId>
      <version>v1-rev20220404-2.0.0</version>
  </dependency>
  ```

- [ ] Create `EmailMessage` DTO
  ```java
  @Data
  @Builder
  public class EmailMessage {
      private String messageId;
      private String subject;
      private String from;
      private String body;
      private LocalDateTime timestamp;
  }
  ```

- [ ] Create `IGmailService` interface
  ```java
  List<EmailMessage> fetchEmails(UUID userId, EmailFetchCriteria criteria);
  ```

- [ ] Implement `GmailService`
  - Build Gmail client with user's access token
  - Construct query string: `from:(linkedin.com) after:2024-01-01`
  - Fetch messages using `users().messages().list()`
  - Parse message details (subject, from, body, date)
  - Handle pagination (max 500 per request)
  - Add circuit breaker pattern (`@CircuitBreaker`)

- [ ] Add unit tests
  - Mock Gmail API responses
  - Test query construction
  - Test email parsing

**Dependencies:** Task 2.2  
**Verification:** Fetch 10 LinkedIn emails from test Gmail account

---

### Task 3.2: LinkedIn Email Parser 🔍
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Create `EmailType` enum
  ```java
  public enum EmailType {
      INMAIL, CONNECTION_REQUEST, MESSAGE_REPLY, UNKNOWN
  }
  ```

- [ ] Create `ParsedLinkedInEmail` DTO (see architecture doc)

- [ ] Create `ILinkedInEmailParser` interface
  ```java
  ParsedLinkedInEmail parse(EmailMessage email);
  boolean isLinkedInEmail(EmailMessage email);
  EmailType detectEmailType(EmailMessage email);
  ```

- [ ] Implement `LinkedInEmailParser`
  - Regex patterns for InMail, connection requests, message replies
  - Extract recruiter name, job title, company
  - Extract LinkedIn profile URL
  - Extract message preview
  - Flag personalized vs generic messages (keyword detection)

- [ ] Add comprehensive unit tests
  - Test with real LinkedIn email samples (anonymized)
  - Test each email type
  - Test edge cases (missing fields, malformed emails)

**Dependencies:** Task 3.1  
**Verification:** Parse sample InMail email, verify recruiter name extracted correctly

---

### Task 3.3: Deduplication Service 🔒
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Create `IDeduplicationService` interface
  ```java
  String generateFingerprint(InteractionEventDTO eventDTO);
  boolean isDuplicate(String fingerprint);
  void recordFingerprint(UUID eventId, String fingerprint, DataSource source);
  ```

- [ ] Implement `DeduplicationService`
  - Fingerprint algorithm: SHA-256 hash of (interaction_id + event_type + timestamp + normalized_message + channel)
  - Normalize message: lowercase, trim, remove extra spaces, truncate to 100 chars
  - Check `existsByFingerprint` before creating event
  - Save fingerprint after event creation

- [ ] Add unit tests
  - Test fingerprint consistency (same input = same hash)
  - Test duplicate detection
  - Test fingerprint recording

**Dependencies:** Task 1.4  
**Verification:** Generate fingerprint for same event twice, verify hash matches

---

### Task 3.4: Email to Interaction Mapper 🗺️
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/mapper/`

- [ ] Create `IEmailToInteractionMapper` interface (MapStruct)
  ```java
  @Mapper(componentModel = "spring")
  public interface IEmailToInteractionMapper {
      InteractionEventDTO toEventDTO(ParsedLinkedInEmail parsed);
  }
  ```

- [ ] Implement mapping logic
  - Map `emailType` → `InteractionEventType` (INMAIL/CONNECTION_REQUEST → OUTREACH)
  - Map `emailTimestamp` → `eventTimestamp`
  - Map `messagePreview` → `messagePreview`
  - Set `channel` = `LINKEDIN`
  - Set `isPersonalized` and `isUrgent` flags

- [ ] Add unit tests
  - Test mapping for each email type
  - Verify all fields populated

**Dependencies:** Task 3.2  
**Verification:** Map ParsedLinkedInEmail, verify DTO fields correct

---

## Phase 4: Integration & Orchestration (Week 4-5)

### Task 4.1: Email Integration Facade 🎭
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Create `SyncRequest` DTO
  ```java
  @Data
  public class SyncRequest {
      private EmailProvider provider;
      private SyncMode syncMode; // INCREMENTAL, FULL
      private LocalDateTime dateFrom;
      private LocalDateTime dateTo;
  }
  ```

- [ ] Create `SyncJobResult` DTO (see architecture doc)

- [ ] Create `IEmailIntegrationFacade` interface
  ```java
  CompletableFuture<SyncJobResult> syncEmails(UUID userId, SyncRequest request);
  SyncJobResult getSyncJobStatus(UUID jobId);
  ```

- [ ] Implement `EmailIntegrationFacade`
  - Orchestrate entire workflow: fetch → parse → deduplicate → persist
  - Use `@Async` for background processing
  - Track job progress in database (`sync_jobs` table - optional)
  - Handle errors gracefully (log, skip email, continue)
  - Return detailed result with counts

- [ ] Add integration tests
  - Test full sync flow with 100 mock emails
  - Verify deduplication works
  - Verify interactions and events created

**Dependencies:** Task 3.1, 3.2, 3.3, 3.4  
**Verification:** Trigger sync, verify interactions created in database

---

### Task 4.2: Sync Controller Endpoints 🎮
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/controllers/`

- [ ] Create `SyncController`
  ```java
  @RestController
  @RequestMapping("/api/email/sync")
  public class SyncController {
      
      @PostMapping("/trigger")
      public ResponseEntity<SyncJobResult> triggerSync(@RequestBody SyncRequest request);
      
      @GetMapping("/status/{jobId}")
      public ResponseEntity<SyncJobResult> getSyncStatus(@PathVariable UUID jobId);
      
      @GetMapping("/history")
      public ResponseEntity<List<SyncHistory>> getSyncHistory();
  }
  ```

- [ ] Implement endpoints
  - Validate request (dateFrom < dateTo, etc.)
  - Queue sync job via `EmailIntegrationFacade`
  - Return job ID immediately
  - Provide status endpoint for polling

- [ ] Add rate limiting
  - Max 1 sync request per user per hour
  - Use `@RateLimiter` annotation (Resilience4j)

**Dependencies:** Task 4.1  
**Verification:** Postman test `POST /api/email/sync/trigger` returns job ID

---

### Task 4.3: Frontend - Sync Dashboard 📊
**Location:** `more-frontend/src/app/functional-features/interactions/email-sync/`

- [ ] Update `email-sync.component.ts`
  - Add "Sync Now" button (calls `POST /api/email/sync/trigger`)
  - Add "Historical Sync" option with date range picker
  - Show sync progress bar (poll `GET /api/email/sync/status/{jobId}` every 3 seconds)
  - Display sync results: emails processed, new interactions, duplicates skipped
  - Show sync history table (last 10 syncs)

- [ ] Update `email-sync.component.html`
  - Progress bar with percentage
  - Stats cards: "Emails Processed", "New Interactions", "Duplicates"
  - History table: Date, Status, Emails, Interactions
  - Error handling: display error messages if sync fails

- [ ] Update `email-sync.component.css`
  - Progress bar animation
  - Stats card styling
  - Loading spinner during sync

**Dependencies:** Task 4.2  
**Verification:** Trigger sync, see progress bar update in real-time

---

### Task 4.4: Extend IInteractionService for Bulk Operations 📦
**Location:** `more-api/src/main/java/za/co/contrusion/apis/more/outreach/services/`

- [ ] Update `IInteractionService` interface
  ```java
  SyncJobResult bulkCreateFromEmails(List<InteractionEventDTO> events);
  ```

- [ ] Implement bulk creation logic
  - Group events by recruiter (using LinkedIn URL or email)
  - Find or create recruiter entity
  - Find or create interaction (one per recruiter-applicant pair)
  - Add events to interaction
  - Use batch insert for performance (JPA batch size = 50)

- [ ] Add transaction management
  - Wrap in `@Transactional`
  - Rollback on failure, log error, continue with next batch

**Dependencies:** Task 1.4, Task 3.3  
**Verification:** Bulk insert 500 events, verify completion in <30 seconds

---

## Phase 5: Polish & Production-Ready (Week 5-6)

### Task 5.1: Error Handling & Resilience 🛡️
**Location:** Throughout services

- [ ] Add circuit breaker to Gmail API calls
  - Use Resilience4j `@CircuitBreaker`
  - Configure: open after 5 failures, half-open after 30 seconds

- [ ] Add retry logic
  - Retry token refresh up to 3 times with exponential backoff
  - Retry Gmail API calls on 5xx errors

- [ ] Add comprehensive error handling
  - Catch `GoogleJsonResponseException` for API errors
  - Handle rate limiting (429) - queue request, retry after delay
  - Handle token expiry (401) - auto-refresh and retry

- [ ] Add logging
  - Log all OAuth events (consent, refresh, revoke)
  - Log sync job start/end with stats
  - Log parse errors with email message ID

**Dependencies:** Phase 4 complete  
**Verification:** Simulate Gmail API failure, verify circuit breaker opens

---

### Task 5.2: Security Hardening 🔐
**Location:** Controllers + configuration

- [ ] CSRF protection on OAuth callback
  - Validate state parameter exists in session
  - Expire state after 10 minutes

- [ ] Rate limiting on all endpoints
  - Max 10 requests/minute for auth endpoints
  - Max 1 sync trigger per hour per user

- [ ] Audit logging
  - Log OAuth consent with user ID, timestamp, scopes
  - Log token revocation events
  - Log all data access (who accessed whose interactions)

- [ ] Add security headers
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`

**Dependencies:** Phase 4 complete  
**Verification:** Security audit passes (OWASP ZAP scan)

---

### Task 5.3: Performance Optimization ⚡
**Location:** Services + database

- [ ] Add database indexes
  - Index on `interaction_events(event_timestamp)`
  - Index on `recruiter_interactions(applicant_id, recruiter_id)`

- [ ] Optimize Gmail API calls
  - Use `fields` parameter to fetch only needed fields
  - Batch fetch messages (50 per request)
  - Use `gmail.metadata` scope instead of full body when possible

- [ ] Add caching
  - Cache parsed emails for 1 hour (Redis)
  - Cache sync job status for 30 seconds

- [ ] Connection pooling
  - Configure HikariCP pool size = 20
  - Configure OAuth client connection pool

**Dependencies:** Phase 4 complete  
**Verification:** Load test - sync 10,000 emails in <5 minutes

---

### Task 5.4: Documentation & Testing 📝
**Location:** Throughout project

- [ ] API documentation
  - Add Swagger/OpenAPI annotations to all endpoints
  - Generate API docs: `http://localhost:8080/swagger-ui.html`

- [ ] Integration tests
  - End-to-end test: OAuth → Sync → Verify interactions created
  - Test with 1000+ mock emails

- [ ] User documentation
  - Create `docs/EMAIL_SYNC_USER_GUIDE.md`
  - Screenshots of OAuth flow
  - FAQ section

- [ ] Developer documentation
  - Update `README.md` with email sync setup instructions
  - Document environment variables
  - Document testing procedures

**Dependencies:** Phase 5 tasks 1-3  
**Verification:** Test coverage >85%, all docs reviewed

---

## Success Criteria Checklist

### Functional Requirements
- [ ] User can connect Gmail via OAuth 2.0
- [ ] User can trigger manual sync with date range
- [ ] System parses InMail, connection requests, message replies
- [ ] System creates interactions and events from parsed emails
- [ ] Deduplication prevents duplicate events (>99% accuracy)
- [ ] User can view sync history and status
- [ ] User can disconnect Gmail and revoke access

### Non-Functional Requirements
- [ ] Sync 1000 emails in <5 minutes
- [ ] Parse accuracy >95% (test with 100 real emails)
- [ ] OAuth success rate >98%
- [ ] API response time <500ms (auth endpoints)
- [ ] Zero data loss (all parsed data persisted or logged)
- [ ] HTTPS-only API calls
- [ ] Tokens encrypted at rest (AES-256-GCM)

### Testing Requirements
- [ ] Unit test coverage >85%
- [ ] Integration tests for OAuth flow
- [ ] Integration tests for sync workflow
- [ ] Load test: 10,000 emails processed successfully
- [ ] Security audit passed (OWASP ZAP)

### Documentation Requirements
- [ ] Architecture document complete ✅
- [ ] API documentation (Swagger)
- [ ] User guide
- [ ] Developer setup guide

---

## Dependencies & Environment Setup

### Backend Dependencies (pom.xml)
```xml
<!-- Gmail API -->
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-gmail</artifactId>
    <version>v1-rev20220404-2.0.0</version>
</dependency>

<!-- Google OAuth Client -->
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>

<!-- Resilience4j (Circuit Breaker, Retry, Rate Limiter) -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.1.0</version>
</dependency>
```

### Environment Variables
```bash
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Encryption key for email tokens (generate with: openssl rand -base64 32)
EMAIL_TOKEN_ENCRYPTION_KEY=your-base64-encoded-32-byte-key

# Backend URL (for OAuth redirect)
BACKEND_URL=http://localhost:8080

# Frontend URL (for post-OAuth redirect)
FRONTEND_URL=http://localhost:4200
```

### Google Cloud Console Setup
1. Create new project: "More Recruitment Platform"
2. Enable Gmail API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:8080/api/email/gmail/callback`
   - `https://api.more.contrusion.co.za/api/email/gmail/callback` (production)
5. Copy Client ID and Client Secret to `.env`

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gmail API rate limits hit | Medium | High | Implement exponential backoff, queue system |
| OAuth flow breaks in production | Low | Critical | Extensive integration testing, staging environment |
| Parse accuracy < 95% | Medium | Medium | Comprehensive email samples, fallback to manual entry |
| Token encryption key leak | Low | Critical | Use AWS KMS in production, key rotation |
| Performance issues with 10k+ emails | Medium | High | Implement pagination, batch processing, caching |

---

## Next Steps

1. **Review this architecture and task breakdown with team**
2. **Set up Google Cloud project and OAuth credentials**
3. **Start Phase 1: Database migrations and foundation**
4. **Weekly sprint planning using this task list**
5. **Update task status as you progress (⏳ → ✅)**

---

## Questions for Team Discussion

1. **Historical Data Limit:** Default to 1 year or ask user during first sync?
2. **Sync Frequency:** Auto-sync daily or manual-only?
3. **Email Labeling:** Should we auto-label processed emails in Gmail?
4. **Multi-Account:** Support multiple Gmail accounts per user?
5. **Conflict Resolution:** Email arrives after manual entry - which wins?

---

## Notes

- This task list assumes sequential implementation. Some tasks can be parallelized (e.g., frontend and backend work).
- Each task should have a corresponding feature branch: `feature/email-sync-task-1.1`
- Code review required for all PRs before merging to `develop`
- Update this document as you discover new requirements or blockers
