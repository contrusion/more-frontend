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

### User Registration
- [ ] **Enable email verification on registration**
  - Current: User profiles may be active immediately after registration
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

