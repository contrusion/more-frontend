# Production Readiness Checklist

## Branding & UI

### Logo & Visual Identity
- [ ] **Update application logo**
  - Current: Placeholder or development logo
  - Required: Professional logo for production deployment
  - Locations to update:
    - Frontend app icon/favicon
    - Login page branding
    - Email templates
    - OAuth consent screen
    - Documentation
  - Formats needed: SVG, PNG (various sizes), ICO (favicon)

## Authentication & User Management

## Feature Access Controls

### Interactions and Events Availability
- [ ] **Prefer user-friendly navigation labels for candidate-facing opportunity flows**
  - Current: The feature is internally described as "Interactions", and the page-level label "Events" is too generic and can be confused with admin-only operational workflows
  - Required: Use a customer-friendly label such as "Job Leads" or "Recruiter Leads" for the main candidate-facing flow, while keeping "Interactions" or "Interaction Events" as internal/admin technical terminology only where needed
  - UX rationale:
    - "Job Leads" is clearer in a recruitment product because it communicates value and intent immediately
    - "Recruiter Leads" is more explicit when the experience is centered on outreach and external recruiter contact
    - "Events" alone is too vague for a customer-facing product and should not be used as the primary top-level label
    - "Interaction Events" is acceptable as a technical or secondary label when describing the underlying activity stream, but it should not be the main navigation name seen by candidates
  - Recommended naming split:
    - Candidate-facing navigation: "Recruiter Leads" as the main lead-tracking experience
    - Secondary or workflow-specific classification: "Recruiter Outreach" when describing active outbound/inbound recruiter contact streams
    - Technical/internal detail: "Interaction Events"
    - Avoid: generic "Events" as a top-level user-facing label
  - Naming distinction:
    - "Recruiter Leads" = the collection of opportunities or recruiter conversations the user is managing
    - "Recruiter Outreach" = the communication activity or outreach stream itself
    - "Interaction Events" = the lower-level technical event log behind either view
  - Validation:
    - Confirm the main candidate-facing navigation and page headings read as job opportunities rather than generic interaction tooling
    - Confirm admin-only technical terminology is hidden from end-user flows unless explicitly required by internal administration tasks

- [ ] **Feature-toggle Interactions and Events off for admin in INT/Production**
  - Current: Interactions pages are directly accessible via routes such as `/interactions/events`
  - Required: Interactions and Events pages must remain available to candidates and recruiters, but be disabled for admin users outside local development
  - Environment and role rule:
    - Local: enabled for admin, candidates, and recruiters
    - INT: disabled for admin, enabled for candidates/recruiters
    - Production: disabled for admin, enabled for candidates/recruiters
  - Implementation guidance:
    - Add an environment-driven feature flag (example: `features.interactionsEventsEnabled`)
    - Apply an admin-only access guard on interactions routes using role checks
    - Keep route availability for candidate/recruiter roles
    - Hide admin navigation links for interactions when the feature is disabled
    - If a disabled admin route is hit directly, redirect to an allowed page (for example `/home`) with a non-blocking message
  - Validation:
    - Confirm admin nav drawer does not expose Interactions/Events in INT/Production
    - Confirm admin deep links to `/interactions/events` are blocked in INT/Production
    - Confirm candidate and recruiter access remains available in INT/Production
    - Confirm local environment retains full access for testing

- [ ] **Extract and surface opportunity metadata from recruiter emails**
  - Current: Opportunity context is inconsistent because the UI may rely on recruiter-company metadata or raw preview text rather than the actual client-company and role facts
  - Required: The model should extract and expose email-level opportunity facts that inform candidate guidance and decision making
  - Required fields:
    - company recruiting for
    - position title
    - required skills
    - work location
    - hybrid/remote/office requirement
    - proposed salary
    - visa constraints
    - notice period
    - interview date
    - deal-breaker count and priority blockers
  - Validation:
    - Prefer structured email metadata over raw preview text when both exist
    - Ensure the accordion header uses actual client company when available and falls back to role-only display when not
    - Ensure candidate guidance can read these facts without exposing raw message taxonomy labels

### User Registration
- [ ] **Enable email verification on registration**
  - Current: User profiles may be active immediately after registration

    ## ML Email Classification

    - [ ] **Tune Llama classification throughput for production**
      - Current local-testing defaults intentionally favor stability over throughput: `more.ml.classification-threads=2` and `more.ml.request-timeout-seconds=180`
      - Re-benchmark production hardware before increasing concurrency; the current local Ollama setup can time out when several classifications run in parallel
      - Add explicit back-pressure and capacity testing so Gmail sync does not overload the inference service during large inbox scans
      - Revisit request timeout, worker count, and model sizing together; these should be treated as one production tuning exercise, not independent tweaks
  - Required: Send verification email before activating user profile
  - Impact: Prevents spam accounts and ensures valid email addresses
  - Implementation: Configure email verification in user registration flow
  - User can't login/access system until email is verified

- [ ] **Remove Keycloak default registration link**
  - Current: Keycloak login page may show default "Register" link
  - Required: Remove/hide Keycloak registration link since custom registration form is used
  - Impact: Users should only register through custom form (better UX, data validation)
  - Configuration: Update Keycloak realm settings to disable registration page link
  - Custom registration form: `/register` (Angular frontend)

### Password Policies
- [ ] **Review and enforce password complexity requirements**
  - Minimum length, special characters, numbers
  - Password expiration policy (optional)

- [ ] **Implement account lockout after failed login attempts**
  - Suggested: Lock after 5 failed attempts
  - Auto-unlock after 15-30 minutes or admin action

## Email OAuth Integration

### Google OAuth Consent Screen
- [ ] **Move OAuth app from Testing to Production mode**
  - Current: App is in "Testing" mode (limited to test users only)
  - Required: Verify app with Google before publishing to production
  - Impact: Production users can't authorize Gmail access until verified
  - Reference: "Available to any test user with a Google Account. Your app will start in testing mode and will only be available to users you add to the list of test users. Once your app is ready to push to production, you may need to verify your app."
  - Documentation: https://support.google.com/cloud/answer/10311615

### OAuth State Management
- [ ] **Replace in-memory state storage with Redis**
  - Current: `ConcurrentHashMap` in `GmailTokenService` (only works with single instance)
  - Required: Redis/distributed cache for multi-instance deployments
  - Impact: OAuth flow fails in load-balanced environments
  - File: `GmailTokenService.java` (see TODO comment)

### Security Enhancements
- [ ] **Implement rate limiting on OAuth endpoints**
  - Prevent brute force attacks on OAuth flow
  - Suggested: 5 requests per minute per user

- [ ] **Add audit logging for OAuth events**
  - Log OAuth consent, token refresh, revocation
  - Include: userId, action, timestamp, IP address

- [ ] **Consider token revocation list (if needed)**
  - For immediate token invalidation (logout, security breach)
  - Requires Redis or similar distributed store

- Handle scenario when Keycloak is down - what do we say to the user  

### Encryption Key Management
- [ ] **Implement annual encryption key rotation**
  - Schedule: Rotate every 12 months (industry standard for OAuth tokens)
  - Next rotation: February 7, 2027
  - Document rotation procedure (dual-key decryption strategy)

- [ ] **Store encryption key in secrets manager**
  - Current: Environment variable (acceptable for development)
  - Required: AWS Secrets Manager / Azure Key Vault / HashiCorp Vault
  - Never commit key to version control

- [ ] **Set up key rotation alerting**
  - Alert 30 days before rotation due date
  - Alert on key access anomalies
  - Log all key retrieval events

- [ ] **Document key rotation procedure**
  - Option 1: Simple rotation (requires user re-authorization)
  - Option 2: Dual-key decryption (transparent migration)
  - Option 3: Cloud KMS with automatic rotation

- [ ] **Incident response plan for key compromise**
  - Immediate key rotation procedure
  - OAuth token revocation for all users
  - User notification requirements (GDPR compliance)
  - Forensic audit procedures

### Infrastructure
- [ ] **Configure HTTPS for OAuth redirect URIs**
  - Current: `http://localhost:8081` (development only)
  - Required: `https://yourdomain.com` for production
  - Update: Google Cloud Console redirect URI configuration

- [ ] **Set environment variables in production**
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `EMAIL_TOKEN_ENCRYPTION_KEY`
  - Use secrets manager (e.g., AWS Secrets Manager, Azure Key Vault)

- [ ] **Configure token expiration appropriately**
  - Review Keycloak access token lifetime (current: typically 5-15 min)
  - Ensure refresh token rotation is enabled

### Monitoring & Alerting
- [ ] **Set up monitoring for OAuth failures**
  - Track failed token exchanges
  - Alert on high error rates

- [ ] **Monitor token refresh failures**
  - Alert when refresh tokens expire (user needs to re-authorize)

### Application Refresh Strategy
- [ ] **Document the refresh strategy for score-based pages**
  - Current status: the final strategy is still under review and should not be treated as a fixed default yet
  - Rationale: background polling adds unnecessary network traffic, increases AWS egress cost, and should be kept minimal if used at all
  - Temporary fallback: a narrow 30s polling refresh may remain acceptable only on the market-readiness page while asynchronous recalculation or cross-device updates are still possible
  - Future redesign: evaluate a save-triggered refresh, websocket/event-stream updates, or server-published cache invalidation once the product reaches higher scale
  - Scope note: any polling should remain local to the page that needs near-real-time feedback, not a blanket app-wide polling strategy
  - Maybe we can just update on load, then provide a last updated date and time (or maybe have a refresh button)

### Compliance
- [ ] **Review data retention policies**
  - Encrypted OAuth tokens stored indefinitely
  - Consider auto-deletion after X days of inactivity

- [ ] **GDPR compliance review**
  - Right to deletion: Ensure revoke endpoint deletes all user OAuth data
  - Data portability: Consider export functionality

### Testing
- [ ] **Load test OAuth flow**
  - Concurrent authorization attempts
  - Token refresh under load

- [ ] **Security penetration testing**
  - Test OAuth state parameter CSRF protection
  - Verify encryption at rest
  - Test expired token rejection

### Documentation
- [ ] **Create user-facing OAuth consent documentation**
  - Explain what permissions are requested and why
  - Privacy policy for email access

- [ ] **Document OAuth troubleshooting**
  - Common errors and solutions
  - How to revoke and re-authorize

## Data Integrity & Linking (Phase 4)

### External Recruiter Registration Handling
- [ ] **Implement recruiter linking when external recruiter registers**
  - Current: External LinkedIn recruiters stored with `recruiter_id = NULL` and `externalRecruiterEmail`
  - Scenario: External recruiter (e.g., john.recruiter@company.com) has interactions imported from LinkedIn emails
  - Problem: If they later register in the system, their existing interactions remain unlinked
  - Required: Automatic or manual process to link past interactions to new recruiter account
  
- [ ] **Build recruiter matching algorithm**
  - Match by email address: `externalRecruiterEmail = recruiter.email`
  - Update all matching interactions: Set `recruiter_id`, optionally clear `externalRecruiterEmail`
  - Trigger: On recruiter registration completion or admin-initiated batch job
  
- [ ] **Create batch job for historical data migration**
  - Find all interactions with `recruiter_id = NULL` AND `externalRecruiterEmail IS NOT NULL`
  - Match against registered recruiters by email
  - Update interactions and log changes for audit
  
- [ ] **Add admin UI for manual recruiter linking**
  - View unlinked interactions grouped by `externalRecruiterEmail`
  - Manual link/merge functionality for recruiters with multiple emails
  - Undo capability in case of incorrect linking
  
- [ ] **Consider notification system**
  - Notify applicants when external recruiter registers and links to their interactions
  - "John Doe from TechCorp has joined the platform - view their verified profile"
  
- [ ] **Data migration strategy**
  - Decision: Keep `externalRecruiterEmail` after linking (for audit) OR clear it (clean data)
  - Add `linked_at` timestamp to track when external recruiter was linked
  - Log all linking operations for compliance and debugging

### Database Constraints
- [ ] **Verify nullable `recruiter_id` field**
  - Confirmed: V2__Add_Tables.sql already has `recruiter_id VARCHAR(36) REFERENCES recruiters(id)` (nullable)
  - No migration needed for schema

