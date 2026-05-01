# Recruitment App Extension - Phase 1 Plan & User Stories

## Context

**Problem:** The existing "More" app is a recruiter-facing email management and interaction tracking platform. The recruitment app extension transforms this into a **comprehensive talent ecosystem** that includes:
- Candidate growth portfolios with verified proof of improvement
- Real-time goal tracking and progress visualization
- Candidate classification (Gold/Silver/Bronze) based on activity and achievements
- Application history and feedback aggregation
- Recruiter performance metrics and company visibility

**Goal:** Create a curated ecosystem where **top performers stand out**, motivating candidates to continuously improve while giving recruiters and companies confidence in hiring decisions.

**Why Now:** The "More" app already has:
- OIDC/Keycloak multi-role authentication (APPLICANT, RECRUITER, MO_ADMIN)
- Email integration and Gmail OAuth flow
- Core interaction threading and event logging
- Daily digest aggregation and analytics
- Standalone Angular 20 component architecture

The recruitment extension will reuse this foundation and add candidate-facing features.

---

## Strategic Decisions (Locked)

1. **MVP Release:** Phase 1 Complete (Goals → Living CV → Class System → Privacy Settings + Application History)
2. **Company Portal:** Role-Based Routing (integrated into More app with COMPANY role)
3. **File Storage:** AWS S3 (scalable, secure, serverless proof uploading)
4. **Monetization:** Phase 2 Identity Reveal System (see US 1.8-1.10 for complete workflow)
   - **Core Revenue Driver:** Companies pay to unlock candidate identities
   - **Two Pathways:** Subscription (discounted placement 10-12%) vs Contingency (full placement 20-30%)
   - **Technical Foundation:** System-generated aliases (US 1.3a) prevent platform bypassing
5. **ML Integration:** Rule-based pattern matching for Phase 3 (defer full ML integration)
6. **Onboarding:** Tutorial-based for new candidates learning Living CV and goal tracking

---

## Implementation Approach

**Launch Order (6-8 sprints):**
1. **Sprint 1-2 (Phase 1):** 
   - Backend: Candidate Goals, Milestones, Alias generation (US 1.3a), Privacy settings (US 1.5)
   - Frontend: Goal management UI, Living CV display with aliases
2. **Sprint 2-3 (Phase 1 continued):**
   - Backend: Class calculation (weekly batch), Application tracking
   - Frontend: Class badges, application history, privacy controls
3. **Sprint 3 (Phase 1.5):**
   - Trust Layer: Onboarding tutorials, authenticity warnings (US 1.11)
   - Email sync for applications, daily digest updates
4. **Sprint 4-5 (Phase 2):**
   - Monetization Core: Identity reveal workflow (US 1.8), Stripe integration (US 1.9)
   - Company subscription dashboard, reveal request flow
   - Keycloak COMPANY role support
5. **Sprint 6-7 (Phase 2 continued):**
   - Company dashboard alpha, recruiter features (filter by class)
   - Testing identity reveal end-to-end workflow
6. **Sprint 7-8 (Phase 3):**
   - Audit logging (US 1.10), compliance reporting
   - Polish, performance optimization, deployment

**Tech Stack for Phase 1-2:**
- Frontend: Angular 20 (standalone components, role-based routing, RxJS state management)
- Backend: Extend existing API with new endpoints (Goals, Applications, Milestones, Class calculation, Privacy settings, Identity Reveal, Subscription management)
- Auth: Keycloak—add COMPANY role + subscription tier attributes (FREE | PRO | ENTERPRISE)
- Payment: Stripe integration for company subscriptions and identity reveal transactions
- Storage: AWS S3 for proof uploads (signed URLs, direct upload)
- Infrastructure: Reuse existing deployment (assumed Docker/K8s)

---

## Architecture Integration

### Existing Capabilities to Leverage

| Capability | Reuse | Why |
|-----------|-------|-----|
| **Auth (Keycloak/OIDC)** | Yes | Add CANDIDATE role, role-based UI filtering |
| **Interaction Service** | Yes | Extend to track job applications, feedback, interview outcomes |
| **Gmail OAuth & Email Sync** | Yes | Auto-parse recruiter messages, extract job offers, feedback |
| **Daily Digest** | Yes | Candidate digest: "Applications to track", "Feedback received", "Interview invites" |
| **Standalone Components** | Yes | New candidate-facing pages: Portfolio, Goals, Applications, Living CV |
| **TopBar Navigation** | Yes | Role-filtered tiles (APPLICANT sees portfolio, RECRUITER sees dashboard) |
| **Role-Based Guards** | Yes | Protect candidate features behind CANDIDATE role, recruiter features behind RECRUITER role |

---

## User Stories by Role & Phase

### PHASE 1: Candidate Growth Portfolio & Goal Tracking (MVP)

#### Epic: Candidate Portfolio & Growth Proof

**US 1.1: Candidate Can Create Growth Goals**
- **As a** candidate
- **I want to** set measurable goals (e.g., "Complete Java Certification by June 30")
- **So that** recruiters can see I'm actively improving
- **Acceptance Criteria:**
  - Create goal with title, description, target date, category (skill, cert, project, etc.)
  - Goals persist in backend
  - Goals visible on candidate's public profile/Living CV
  - Can edit/delete own goals
  - Soft delete for historical tracking
- **Components to Create:**
  - `CandidateGoalsComponent` (manage goals)
  - `GoalFormComponent` (create/edit modal)
  - `GoalCardComponent` (display single goal with status)
- **Data Model:** Goal with status (Not Started, In Progress, Completed, Abandoned)
- **Estimated Endpoints:** POST/GET/PATCH/DELETE `/api/candidates/goals`

**US 1.2: Candidate Can Log Progress & Proof** ✅ *Implemented*
- **As a** candidate
- **I want to** log milestones with proof links (certificates, project links, GitHub repos, feedback letters)
- **So that** my goal progress is verifiable, transparent, and trusted by companies when they engage
- **Acceptance Criteria:**
  - ✅ Candidate logs milestones with a title, notes, and a progress checkpoint (25/50/75/100%)
  - ✅ Proof items (links) attached to specific milestones, not directly to goals
  - ✅ Proof marked as **Pending Verification** on creation — lazy verification model
  - ✅ Goal auto-transitions to **IN_PROGRESS** when first milestone is added
  - ✅ Goal auto-transitions to **COMPLETED** when a 100% milestone is logged
  - ✅ Abandoned goals can be reopened (transitions back to IN_PROGRESS)
  - ✅ Goal cards show state-driven action buttons:
    - NOT_STARTED / IN_PROGRESS → "Add Milestone" (primary) + "Edit" + "Delete"
    - COMPLETED → "Edit" + "Delete"
    - ABANDONED → "Reopen Goal" (primary) + "Edit" + "Delete"
  - ✅ `milestoneCount` returned on every `CandidateGoal` response
- **Components Created:**
  - ✅ `MilestoneFormComponent` (modal: title, notes, completion % selector; housed at `goals/milestone-form/`)
  - `ProgressTimelineComponent` — deferred to Phase 1.5
- **Services Created:**
  - ✅ `MilestoneService` (`getMilestones`, `createMilestone`, `addProof`)
  - ✅ `GoalService.reopenGoal()` (PATCH reopen endpoint)
- **Data Model:**
  - ✅ `GoalMilestone` — `id, goalId, title, description, completionPercentage (0–100), completedAt, proofItems[], createdAt, updatedAt`
  - ✅ `MilestoneProofItem` — `id, milestoneId, type (ProofType), title, url, uploadedAt, verificationStatus (PENDING/VERIFIED/REJECTED), isPublic`
  - ✅ `ProofType` enum — `CERTIFICATE | URL | GITHUB_REPO | PROJECT_LINK | EMAIL_RECOMMENDATION`
  - ✅ `VerificationStatus` enum — `PENDING | VERIFIED | REJECTED`
- **Implemented Endpoints:**
  - ✅ `POST /api/candidates/goals/{goalId}/milestones` — Create milestone (auto-transitions goal status)
  - ✅ `GET /api/candidates/goals/{goalId}/milestones` — List milestones for a goal
  - ✅ `POST /api/candidates/goals/{goalId}/milestones/{milestoneId}/proof` — Attach proof link to milestone (starts PENDING)
  - ✅ `PATCH /api/candidates/goals/{goalId}/reopen` — Reopen an abandoned goal
- **DB Migration:** ✅ `V5__Add_Goal_Milestones.sql` — `goal_milestones` + `milestone_proof_items` tables
- **Cost Optimization:** Verification deferred until company engagement — proof items are link-only at this stage (no S3 uploads), reducing infrastructure cost at MVP scale

**US 1.3: Candidate Can View Their Living CV**
- **As a** candidate
- **I want to** see a dynamic, real-time view of my career profile (Living CV)
- **So that** I can understand how recruiters see me
- **Acceptance Criteria:**
  - Living CV displays: profile info, goals, proof, completed milestones, current class (Gold/Silver/Bronze)
  - Automatically updates when goals/milestones change
  - Can toggle privacy settings (identity reveal options)
  - Shows last updated timestamp
  - Clean, professional visual design
- **Components to Create:**
  - `LivingCvComponent` (main display)
  - `LivingCvSectionComponent` (reusable section for goals, skills, achievements)
- **Data Model:** Aggregates Goal, Milestone, and candidate profile data
- **Estimated Endpoints:** GET `/api/candidates/{id}/living-cv`

**US 1.3a: System Generates Anonymized Candidate Aliases** *(Technical Foundation)*
- **As a** system
- **I want to** auto-generate unique, professional aliases for candidates
- **So that** real identities remain hidden until companies transact
- **Acceptance Criteria:**
  - Generate alias on candidate registration (e.g., "TechPro_4782", "JavaDev_2056")
  - Alias displayed in all Living CVs and search results
  - Real name/email never exposed in API responses to companies without reveal
  - Alias persists and doesn't change (brand consistency)
  - Candidate can see their alias in profile settings
- **Data Model:**
  ```typescript
  CandidateProfile {
    publicAlias: string              // "TechPro_4782"
    firstName: string                // Hidden from companies
    lastName: string                 // Hidden from companies  
    email: string                    // Hidden from companies
    ...
  }
  ```
- **Estimated Endpoints:**
  - GET `/api/candidates/public/{alias}` - Returns anonymized CV
  - Modify existing endpoints to return `publicAlias` instead of real name
- **Phase:** Phase 1 (Foundation) - **Must come before reveal logic**

**US 1.4: System Calculates Candidate Class (Gold/Silver/Bronze)**
- **As a** system
- **I want to** automatically classify candidates based on activity
- **So that** recruiters can prioritize high-performers
- **Acceptance Criteria:**
  - Gold: 3+ active goals, 3+ completed proof items, updated in last 7 days
  - Silver: 1-2 active goals, 1-2 proof items, updated in last 30 days
  - Bronze: 0 goals or stale (30+ days without update)
  - Recalculate weekly
  - Classification visible in profiles and recruiter filters
  - Candidate notified when class changes (gamification)
- **Implementation:**
  - Service method in backend to calculate class
  - Exposed as field in `/api/candidates/{id}` response
  - Frontend displays as badge/indicator
- **Estimated Endpoints:** GET `/api/candidates/{id}` includes `class` field

**US 1.5: Candidate Can Manage Privacy & Visibility** *(Simplified)*
- **As a** candidate
- **I want to** control which goals and proof items are visible on my public profile
- **So that** I can curate my professional presentation
- **Acceptance Criteria:**
  - Choose which proof items are visible publicly
  - Can hide specific goals from Living CV
  - Privacy settings accessible in profile settings
  - Settings persist and apply to Living CV display
- **Components to Create:**
  - `PrivacySettingsComponent` (settings page)
  - `VisibilityToggleComponent` (per-goal/proof toggles)
- **Data Model:** PrivacySetting entity with visible_goals[], visible_proof[]
- **Estimated Endpoints:** GET/PATCH `/api/candidates/{id}/privacy-settings`
- **Phase:** Phase 1

---

#### Epic: Application History & Feedback Aggregation (Phase 1.5)

**US 1.6: System Auto-Logs Applications**
- **As a** candidate
- **I want to** automatically see all my job applications in one place
- **So that** I can track where I've applied and follow up strategically
- **Acceptance Criteria:**
  - Integration with Gmail/email sync to identify job applications
  - Parse company name, job title, application date from emails
  - Link to recruiter if identified
  - Prevent duplicate application logging
  - Manually add applications if auto-parse fails
- **Implementation:**
  - Extend `EmailSyncService` to parse application confirmations
  - Create `ApplicationService` to manage application records
  - Re-use existing `InteractionService` for event logging
- **Components to Create:**
  - `ApplicationHistoryComponent` (list view with filters)
  - `ApplicationDetailComponent` (single app with timeline)
- **Data Model:** Application with company, job_title, date, status, feedback[], recruiter_id
- **Estimated Endpoints:** GET `/api/candidates/{id}/applications`, POST `/api/candidates/{id}/applications` (manual add)

**US 1.7: Candidate Can View & Organize Feedback**
- **As a** candidate
- **I want to** centralize feedback from all interviews and rejections
- **So that** I can improve my approach based on patterns
- **Acceptance Criteria:**
  - Collect feedback from InteractionEvents (parsed from emails/feedback forms)
  - Categorize feedback: technical skills, communication, fit, experience, etc.
  - View reasons for rejections
  - Get AI-generated improvement suggestions based on patterns
  - Filter feedback by company, recruiter, date
- **Components to Create:**
  - `FeedbackCollectionComponent` (list of all feedback)
  - `FeedbackAnalysisComponent` (patterns & suggestions)
- **Data Model:** Feedback with category, sentiment, source, related_goal
- **Estimated Endpoints:** GET `/api/candidates/{id}/feedback`, calculate patterns in component

---

#### Epic: Identity Reveal & Monetization (Phase 2)

**US 1.8: Company Can Request Candidate Identity Reveal** *(Business Logic)*
- **As a** company
- **I want to** request a candidate's real identity after reviewing their Living CV
- **So that** I can initiate hiring discussions
- **Acceptance Criteria:**
  - Company views anonymized Living CV (alias only)
  - "Request Identity" button triggers workflow
  - System checks company's subscription/payment status
  - Redirect to appropriate pathway:
    - **Pathway A:** Active subscriber → Unlock immediately, log discounted placement fee (10-12%)
    - **Pathway B:** Non-subscriber → Redirect to payment page (20-30% placement fee)
  - Candidate notified when company requests reveal
  - Reveal status tracked: PENDING | APPROVED | REJECTED (future: candidate approval option)
- **Components to Create:**
  - `IdentityRevealButtonComponent` (company-facing)
  - `RevealRequestListComponent` (candidate-facing)
  - `RevealRequestModalComponent` (candidate approval flow - future)
- **Data Model:**
  ```typescript
  IdentityRevealRequest {
    id: string
    candidateId: string
    companyId: string
    requestedAt: Date
    status: RevealStatus            // PENDING_PAYMENT | REVEALED | REJECTED
    pathway: MonetizationPathway    // SUBSCRIPTION | CONTINGENCY
    placementFeePercentage: number  // 10-12% or 20-30%
    revealedAt?: Date
  }
  ```
- **Estimated Endpoints:**
  - POST `/api/companies/{id}/reveal-requests` - Request reveal
  - GET `/api/candidates/{id}/reveal-requests` - Candidate views requests
  - GET `/api/companies/{id}/revealed-candidates` - Company views unlocked candidates
- **Phase:** Phase 2 (Monetization Core)

**US 1.9: System Validates Company Subscription for Discounted Reveal** *(Payment Processing)*
- **As a** system
- **I want to** validate company subscription status before revealing identity
- **So that** only paying companies access candidate details
- **Acceptance Criteria:**
  - Company subscription tiers: FREE (0 reveals) | PRO ($X/month, Y reveals) | ENTERPRISE (unlimited reveals)
  - Stripe integration for subscription management
  - Check subscription status before revealing identity:
    - Active subscriber with available reveals → Unlock + decrement reveal count
    - Expired/no subscription → Redirect to payment page
  - Subscription dashboard for companies to track reveals used/remaining
  - Notification when reveal quota runs low
- **Components to Create:**
  - `CompanySubscriptionDashboardComponent`
  - `SubscriptionUpgradeModalComponent`
  - `RevealQuotaIndicatorComponent`
- **Data Model:**
  ```typescript
  CompanySubscription {
    id: string
    companyId: string
    tier: SubscriptionTier          // FREE | PRO | ENTERPRISE
    revealsRemaining: number        // null for ENTERPRISE (unlimited)
    billingCycle: BillingCycle      // MONTHLY | ANNUAL
    subscriptionStart: Date
    subscriptionEnd: Date
    stripeSubscriptionId: string
  }
  ```
- **Estimated Endpoints:**
  - GET `/api/companies/{id}/subscription` - Get subscription details
  - POST `/api/companies/{id}/subscribe` - Initiate Stripe checkout
  - PATCH `/api/companies/{id}/subscription/cancel` - Cancel subscription
  - POST `/api/webhooks/stripe` - Stripe webhook for payment confirmation
- **Phase:** Phase 2 (Monetization Core)

**US 1.10: System Logs All Identity Reveals for Audit & Compliance** *(Compliance & Legal)*
- **As a** platform administrator
- **I want to** audit all identity reveals and placement transactions
- **So that** we can enforce Terms of Service and track revenue
- **Acceptance Criteria:**
  - Log every reveal with: company, candidate, timestamp, pathway, fee
  - Track off-platform hire violations (future: candidate reports when hired outside platform)
  - Generate audit reports: reveals per month, revenue by pathway, subscription vs contingency split
  - Terms of Service acceptance required before first reveal (company portal)
  - Penalty system for off-platform violations (future: account suspension)
- **Components to Create:**
  - `AuditDashboardComponent` (admin-facing)
  - `RevenueAnalyticsComponent` (admin-facing)
  - `ComplianceReportComponent` (admin-facing)
- **Data Model:**
  ```typescript
  RevealAuditLog {
    id: string
    revealRequestId: string
    candidateId: string
    companyId: string
    revealedAt: Date
    pathway: MonetizationPathway
    placementFeePercentage: number
    subscriptionTier?: string
    invoiceId?: string              // Stripe invoice
  }
  ```
- **Estimated Endpoints:**
  - GET `/api/admin/audit/reveals` - Admin audit dashboard
  - GET `/api/admin/audit/revenue` - Revenue analytics
- **Phase:** Phase 3 (Platform Maturity)

**US 1.11: Candidate Sees Trust Messaging & Authenticity Warning** *(UX & Communication)*
- **As a** candidate
- **I want to** understand how my identity is protected and why authenticity matters
- **So that** I trust the platform and provide accurate information
- **Acceptance Criteria:**
  - Onboarding tutorial explains alias system: "Your alias protects you until companies transact"
  - Warning modal on first proof upload: "False information ruins your reputation and can lead to blocking"
  - Profile settings page shows: "Companies see your alias until they request reveal. Reveals require subscription or placement fee."
  - Email notification when company requests reveal: "Company X wants to unlock your identity. Their subscription covers this reveal."
- **Components to Create:**
  - `OnboardingTutorialComponent` with alias explanation
  - `ProofUploadWarningModal` with authenticity terms
  - `IdentityProtectionInfoComponent` (info panel in settings)
- **Implementation:**
  - Email templates for reveal notifications
  - Tutorial flow integrated into first-time user experience
- **Phase:** Phase 1.5 (Trust Layer) - **Can be implemented alongside US 1.2**

---

### **Story Breakdown Summary: Identity Reveal & Monetization**

| Story | Focus | Phase | Dependencies | Estimated Effort |
|-------|-------|-------|--------------|------------------|
| **US 1.3a** | Technical: Alias generation | Phase 1 | None | 1 sprint |
| **US 1.5** | UX: Privacy settings (simplified) | Phase 1 | US 1.3 | 1 sprint |
| **US 1.8** | Business: Reveal workflow | Phase 2 | US 1.3a, 1.5 | 2 sprints |
| **US 1.9** | Payment: Subscription validation | Phase 2 | US 1.8, Stripe setup | 2 sprints |
| **US 1.10** | Compliance: Audit logging | Phase 3 | US 1.8, 1.9 | 1 sprint |
| **US 1.11** | UX: Trust messaging | Phase 1.5 | US 1.3a | 0.5 sprint |

**Strategic Flow:**
1. **Phase 1:** Build foundation (alias + basic privacy)
2. **Phase 1.5:** Add trust layer (authenticity warnings, onboarding)
3. **Phase 2:** Implement monetization (reveal requests + subscription validation)
4. **Phase 3:** Add compliance (audit logs, ToS enforcement)

**Key Insight:** The alias system (US 1.3a) is the technical foundation that makes monetization defensible. Without it, candidates could expose their identity and bypass the platform.

---

## Data Models (New)

```typescript
// Candidate Goals & Growth
Goal {
  id: string
  candidateId: string
  title: string                    // "Complete Java Certification"
  description: string
  category: GoalCategory           // SKILL | CERTIFICATION | PROJECT | LANGUAGE | OTHER
  targetDate: Date
  status: GoalStatus              // NOT_STARTED | IN_PROGRESS | COMPLETED | ABANDONED
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date                // Soft delete for history
  isPublic: boolean               // Part of Living CV?
}

Milestone {
  id: string
  goalId: string
  title: string
  description: string
  completionPercentage: number    // 0, 25, 50, 75, 100
  completedAt: Date
  proofItems: ProofItem[]
}

ProofItem {
  id: string
  goalId: string
  type: ProofType                 // CERTIFICATE | URL | GITHUB_REPO | PROJECT_LINK | FILE | EMAIL_RECOMMENDATION
  title: string
  url?: string
  fileKey?: string                // S3/blob storage reference
  uploadedAt: Date
  verificationStatus: VerificationStatus  // PENDING | VERIFIED | REJECTED (lazy verification on company engagement)
  isPublic: boolean
  metadata?: {
    issueDate?: Date
    score?: number
    verifiedAt?: Date
    verifiedBy?: string            // Recruiter or system ID
  }
}

CandidateProfile {
  id: string
  userId: string                  // Keycloak user ID (APPLICANT/CANDIDATE)
  publicAlias: string             // "TechPro_4782" - System-generated, never changes
  firstName: string               // Hidden from companies until reveal
  lastName: string                // Hidden from companies until reveal
  email: string                   // Hidden from companies until reveal
  currentRole?: string
  yearsOfExperience?: number
  bio?: string
  avatar?: string
  class: CandidateClass           // GOLD | SILVER | BRONZE (calculated)
  classLastUpdated: Date
  goals: Goal[]
  milestones: Milestone[]
  proofItems: ProofItem[]
  createdAt: Date
  updatedAt: Date
}

Application {
  id: string
  candidateId: string
  companyId?: string
  companyName: string
  jobTitle: string
  recruiterId?: string
  applicationDate: Date
  source: ApplicationSource        // EMAIL_RECEIVED | MANUAL_ENTRY | JOB_BOARD
  status: ApplicationStatus        // SUBMITTED | INTERVIEW_INVITED | REJECTED | OFFER_RECEIVED | ARCHIVED
  feedback?: Feedback[]
  lastUpdateDate: Date
}

Feedback {
  id: string
  applicationId: string
  source: FeedbackSource          // EMAIL | INTERVIEW_FORM | PHONE_CALL | MANUAL_ENTRY
  category: FeedbackCategory      // TECHNICAL | COMMUNICATION | FIT | EXPERIENCE | BEHAVIOR
  sentiment: Sentiment            // POSITIVE | NEUTRAL | NEGATIVE
  content: string
  receivedDate: Date
  recruiterName?: string
}

PrivacySetting {
  id: string
  candidateId: string
  visibleGoals: string[]          // Goal IDs to show publicly
  visibleProof: string[]          // Proof item IDs to show publicly
  updatedAt: Date
}

// Identity Reveal & Monetization (Phase 2+)
IdentityRevealRequest {
  id: string
  candidateId: string
  companyId: string
  requestedAt: Date
  status: RevealStatus            // PENDING_PAYMENT | REVEALED | REJECTED
  pathway: MonetizationPathway    // SUBSCRIPTION | CONTINGENCY
  placementFeePercentage: number  // 10-12% for subscribers, 20-30% for non-subscribers
  revealedAt?: Date
  candidateApprovalRequired: boolean  // Future: manual approval flow
}

CompanySubscription {
  id: string
  companyId: string
  tier: SubscriptionTier          // FREE | PRO | ENTERPRISE
  revealsRemaining: number        // null for ENTERPRISE (unlimited)
  billingCycle: BillingCycle      // MONTHLY | ANNUAL
  subscriptionStart: Date
  subscriptionEnd: Date
  stripeSubscriptionId: string
  stripeCustomerId: string
}

RevealAuditLog {
  id: string
  revealRequestId: string
  candidateId: string
  companyId: string
  revealedAt: Date
  pathway: MonetizationPathway    // SUBSCRIPTION | CONTINGENCY
  placementFeePercentage: number
  subscriptionTier?: string       // PRO | ENTERPRISE (if pathway = SUBSCRIPTION)
  invoiceId?: string              // Stripe invoice reference
  notes?: string
}

// Enums
enum RevealStatus {
  PENDING_PAYMENT
  REVEALED
  REJECTED
}

enum MonetizationPathway {
  SUBSCRIPTION        // Discounted placement fee (10-12%)
  CONTINGENCY         // Full placement fee (20-30%)
}

enum SubscriptionTier {
  FREE                // 0 reveals/month
  PRO                 // X reveals/month
  ENTERPRISE          // Unlimited reveals
}

enum BillingCycle {
  MONTHLY
  ANNUAL
}
```

---

## Frontend File Structure (New)

```
src/app/functional-features/
├── recruitment/                                 # NEW FEATURE MODULE
│   ├── candidate/
│   │   ├── components/
│   │   │   ├── candidate-profile/
│   │   │   ├── living-cv/
│   │   │   ├── goals/
│   │   │   ├── progress/
│   │   │   ├── applications/
│   │   │   ├── feedback/
│   │   │   ├── suggestions/
│   │   │   ├── privacy/
│   │   ├── services/
│   │   │   ├── candidate.service.ts
│   │   │   ├── goal.service.ts
│   │   │   ├── application.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   ├── living-cv.service.ts
│   │   ├── models/
│   │   │   ├── candidate.model.ts
│   │   │   ├── goal.model.ts
│   │   ├── pages/
│   │   │   ├── candidate-dashboard.component.ts
│   │   │   ├── living-cv-page.component.ts
│   │   │   ├── goals-page.component.ts
│   │   │   ├── applications-page.component.ts
│   │   ├── recruitment.routes.ts
│   │
│   ├── recruiter/
│   │   ├── components/
│   │   │   ├── recruiter-dashboard/
│   │   │   ├── candidate-search/
│   │   │   ├── candidate-profile-modal/
│   │   ├── services/
│   │   │   ├── recruiter.service.ts
│   │   │   ├── recruiter-analytics.service.ts
│   │   ├── pages/
│   │   │   ├── recruiter-dashboard-page.component.ts
│   │
│   ├── company/                                 # PHASE 2: Company Portal
│   │   ├── components/
│   │   │   ├── company-dashboard/
│   │   │   ├── subscription-dashboard/
│   │   │   ├── reveal-request-button/
│   │   │   ├── reveal-quota-indicator/
│   │   │   ├── subscription-upgrade-modal/
│   │   │   ├── revealed-candidates-list/
│   │   ├── services/
│   │   │   ├── company.service.ts
│   │   │   ├── identity-reveal.service.ts
│   │   │   ├── subscription.service.ts
│   │   ├── pages/
│   │   │   ├── company-dashboard-page.component.ts
│   │   │   ├── subscription-management-page.component.ts
│   │   │   ├── candidate-search-page.component.ts
│   │
│   ├── admin/                                   # PHASE 3: Admin Portal
│   │   ├── components/
│   │   │   ├── audit-dashboard/
│   │   │   ├── revenue-analytics/
│   │   │   ├── compliance-report/
│   │   ├── services/
│   │   │   ├── audit.service.ts
│   │   ├── pages/
│   │   │   ├── admin-dashboard-page.component.ts
│   │
│   └── shared/
│       ├── components/
│       │   ├── candidate-class-badge/
│       │   ├── goal-card/
│       │   ├── proof-item-display/
│       │   ├── feedback-item/
│       └── models/
│           └── shared-recruitment.model.ts
```

---

## Routing Updates

```typescript
// app.routes.ts additions
{
  path: 'recruitment',
  canActivate: [AuthGuard],
  children: [
    {
      path: 'candidate',
      canActivate: [RoleGuard],
      data: { roles: ['CANDIDATE'] },
      children: [
        { path: 'dashboard', component: CandidateDashboardComponent },
        { path: 'living-cv', component: LivingCvPageComponent },
        { path: 'goals', component: GoalsPageComponent },
        { path: 'applications', component: ApplicationsPageComponent },
        { path: 'feedback', component: FeedbackCollectionComponent },
        { path: 'privacy', component: PrivacySettingsComponent },
      ]
    },
    {
      path: 'recruiter',
      canActivate: [RoleGuard],
      data: { roles: ['RECRUITER'] },
      children: [
        { path: 'dashboard', component: RecruiterDashboardPageComponent },
        { path: 'candidates', component: CandidateSearchComponent },
      ]
    },
    {
      path: 'company',
      canActivate: [RoleGuard],
      data: { roles: ['COMPANY'] },
      children: [
        { path: 'dashboard', component: CompanyDashboardPageComponent },
        { path: 'candidates', component: CandidateSearchPageComponent },
        { path: 'subscription', component: SubscriptionManagementPageComponent },
        { path: 'revealed-candidates', component: RevealedCandidatesListComponent },
      ]
    },
    {
      path: 'admin',
      canActivate: [RoleGuard],
      data: { roles: ['MO_ADMIN'] },
      children: [
        { path: 'dashboard', component: AdminDashboardPageComponent },
        { path: 'audit', component: AuditDashboardComponent },
        { path: 'revenue', component: RevenueAnalyticsComponent },
      ]
    }
  ]
}
```

---

## Cost Optimization Strategy

### Proof Verification (Lazy Verification Model)

**Problem:** At scale, verifying every proof item immediately (URL checks, metadata extraction, malware scanning) and storing files in S3 creates significant costs and administrative overhead.

**Solution:** **Lazy Verification** — Defer proof verification until company engagement
- Proof items start in **PENDING** verification status immediately after upload
- Verification only triggered when:
  - A company requests candidate details for review
  - A recruiter flags a proof item for authenticity check
  - Automated checks (URL validity, metadata extraction) on-demand
- Benefits:
  - Reduces unnecessary S3 storage costs (many proofs never viewed by companies)
  - Candidates remain motivated by authenticity warnings: dishonesty ruins reputation and leads to blocking
  - Recruiter/company gatekeepers verify quality proofs before acting on candidate interest

**Implementation:**
- ProofItem model includes `verificationStatus: PENDING | VERIFIED | REJECTED`
- Endpoint: `PATCH /api/candidates/goals/{id}/proof/{proofId}/verify` (backend batch triggered by company engagement)
- No upfront file scanning or expensive validation for candidates at MVP stage

**Note:** This model scales better than pre-verification at high volume and maintains platform trust through reputation system.

---

## Backend API Endpoints (Proposed)

### Candidate Goals & Growth
- `POST /api/candidates/goals` - Create goal
- `GET /api/candidates/{id}/goals` - List goals
- `PATCH /api/candidates/{id}/goals/{goalId}` - Update goal
- `DELETE /api/candidates/{id}/goals/{goalId}` - Delete goal (soft delete)

### Milestones & Proof
- `POST /api/goals/{goalId}/milestones` - Add milestone
- `GET /api/goals/{goalId}/milestones` - List milestones
- `POST /api/goals/{goalId}/proof` - Upload proof (creates PENDING verification status)
- `PATCH /api/candidates/goals/{id}/proof/{proofId}/verify` - Trigger verification (on company engagement)

### Living CV
- `GET /api/candidates/{id}/living-cv` - Public Living CV view
- `GET /api/candidates/{id}/living-cv/summary` - For company submission

### Applications
- `GET /api/candidates/{id}/applications` - List applications
- `POST /api/candidates/{id}/applications` - Manually add application
- `PATCH /api/candidates/{id}/applications/{appId}` - Update application status

### Feedback
- `GET /api/candidates/{id}/feedback` - List all feedback
- `GET /api/candidates/{id}/feedback/analysis` - Patterns & suggestions

### Privacy Settings
- `GET /api/candidates/{id}/privacy-settings` - Get privacy settings
- `PATCH /api/candidates/{id}/privacy-settings` - Update privacy settings

### Candidate Class Calculation
- `GET /api/candidates/{id}` includes `class` field (GOLD | SILVER | BRONZE)
- Recalculated weekly via backend batch job

### Identity Reveal & Monetization (Phase 2)
- `POST /api/companies/{id}/reveal-requests` - Request candidate identity reveal
- `GET /api/companies/{id}/reveal-requests` - List company's reveal requests
- `GET /api/candidates/{id}/reveal-requests` - Candidate views incoming reveal requests
- `PATCH /api/candidates/{id}/reveal-requests/{requestId}/approve` - Candidate approves reveal (future)
- `GET /api/companies/{id}/revealed-candidates` - List unlocked candidates

### Company Subscriptions (Phase 2)
- `GET /api/companies/{id}/subscription` - Get current subscription details
- `POST /api/companies/{id}/subscribe` - Initiate Stripe checkout session
- `PATCH /api/companies/{id}/subscription/upgrade` - Upgrade subscription tier
- `PATCH /api/companies/{id}/subscription/cancel` - Cancel subscription
- `POST /api/webhooks/stripe` - Stripe webhook for payment events

### Audit & Compliance (Phase 3)
- `GET /api/admin/audit/reveals` - List all identity reveals (admin)
- `GET /api/admin/audit/revenue` - Revenue analytics dashboard (admin)
- `GET /api/admin/audit/companies/{id}` - Company-specific audit log

---

## Monetization Model (Phase 1-2 Implementation)

### Strategic Positioning
**"The alias system enforces anonymity. Companies see anonymized Living CVs, but to unlock real identities they must transact through the platform. Subscribers enjoy discounted placement fees, while non-subscribers pay full contingency rates. This ensures trust, prevents bypassing, and creates recurring monetization."**

### Identity Reveal Monetization (Phase 2 - Core Revenue Driver)

**Pathway A: Subscription + Discounted Placement**
- Companies subscribe for monthly/annual access to anonymized Living CVs
- When requesting identity reveal:
  - Identity unlocked immediately (if subscription active)
  - Discounted placement fee: 10-12% (vs 20-30% for non-subscribers)
- **Benefit:** Predictable recurring revenue + loyalty incentive for companies with steady hiring needs

**Pathway B: Traditional Contingency Placement**
- Companies without subscriptions see anonymized profiles
- Reveal triggered only when they commit to placement
- Full placement fee: 20-30% of salary
- **Benefit:** High-margin revenue for one-off or unpredictable hiring

### Enforcement Mechanisms
1. **Technical Control:** System-generated alias (US 1.3a) prevents candidates from exposing real names
2. **Business Logic:** Reveal workflow (US 1.8) is the monetization gate
3. **Payment Integration:** Subscription validation (US 1.9) ensures only paying companies unlock identities
4. **Legal Control:** Terms of Service prohibit off-platform hires (enforced in Phase 3)
5. **Audit Logging:** Every reveal tracked for transparency (US 1.10)

### Candidate Trust Layer (Integrated with US 1.11)
- Candidates warned upfront: *"Your alias protects your identity. Authenticity matters—false information can ruin your reputation."*
- Reveal happens only when companies engage through platform
- Builds trust while maintaining platform defensibility

---

### Company Subscription Tiers (Phase 2)
```
FREE:
- View anonymized Living CVs (unlimited)
- 0 identity reveals/month
- Full placement fee (20-30%) if purchasing reveals individually

PRO ($299/month):
- 10 identity reveals/month
- Discounted placement fee (10-12%)
- Advanced candidate filtering (class, skills, activity)
- Team access (5 users)

ENTERPRISE ($999/month):
- Unlimited identity reveals
- Discounted placement fee (10-12%)
- API access
- Dedicated account manager
- Custom integration support
```

---

### Candidate Tiers (Phase 1)
```
FREE:
- Up to 5 goals
- Up to 10 proof items
- Basic Living CV (anonymized)
- Application history (read-only)

PRO ($9.99/month):
- Unlimited goals & proof items
- Living CV with identity reveal options
- Advanced feedback analytics
- Priority submission to Gold recruiters

PREMIUM ($29.99/month):
- All PRO features + AI suggestions
- 1:1 career coaching recommendations
- Priority placement in Gold filter
```

### Recruiter Tiers (Phase 1)
```
FREE:
- View 10 anonymized candidates max
- No class filtering

PRO ($49.99/month):
- Unlimited anonymized candidates
- Filter by class (Gold/Silver/Bronze)
- Performance dashboard
- Submission to companies
- Team access (2 users)

AGENCY ($199.99/month):
- All PRO features
- Unlimited team members
- API access
- Market insights reports
- Priority support
```

### Implementation Details (References User Stories)
- **Alias Generation:** US 1.3a - Auto-generate on registration
- **Reveal Workflow:** US 1.8 - Company requests, system validates subscription
- **Subscription Validation:** US 1.9 - Stripe integration, quota tracking
- **Audit Logging:** US 1.10 - Track all reveals for compliance
- **Trust Messaging:** US 1.11 - Onboarding tutorials, authenticity warnings
- **Stripe Integration:**
  - Recurring billing for subscriptions
  - Frontend tier gates in `RoleGuard` data attributes
  - Free trial: 7 days (auto-downgrade to FREE tier)
  - Subscription management in user settings
  - Backend webhook: `POST /api/webhooks/stripe` for payment sync

---

## Integration with Existing Components

### TopBar/Navigation
- Add "Portfolio" and "Living CV" tiles for CANDIDATE role
- Add "Candidates" tile for RECRUITER role (redirects to candidate profiles)
- Keep existing "Dashboard" and "Analytics" for recruiter

### Home Component
- Show role-specific tiles: CANDIDATE sees portfolio/apps/feedback, RECRUITER sees pipeline/candidates/analytics

### Daily Digest (Extend)
- **For Candidates:** "2 new application responses", "1 new interview scheduled", "Goal milestone approved"
- **For Recruiters:** "5 Gold-class candidates in pipeline", "2 placements this week"

### Email Sync (Extend)
- Parse application confirmations and extract job details
- Parse interview invites and feedback emails
- Flag emails as "Feedback" for candidate collection

### Interactions Service (Extend)
- Add `EventType.GOAL_MILESTONE_COMPLETED` and `CANDIDATE_SUBMISSION` types
- Extend metadata to include Living CV summary

---

## Verification & Testing

### End-to-End Workflows to Validate

**Candidate Journey:**
1. Candidate logs in (role: CANDIDATE/APPLICANT)
2. Creates goal "Learn Java" with target date
3. Uploads Java cert 2 weeks later
4. Living CV updates automatically
5. Class changes from Silver to Gold
6. Daily digest notifies: "Congratulations! You've reached Gold class"
7. Recruiter sees candidate in Gold filter

**Recruiter Journey:**
1. Recruiter logs in (role: RECRUITER)
2. Filters candidates by Gold class
3. Clicks candidate → sees Living CV modal
4. Adds note: "Strong Java dev"
5. Submits candidate to Company with Living CV context

**Candidate Class Calculation:**
1. System runs weekly batch job at midnight
2. Calculates: active goals, proof items, last update date
3. Assigns GOLD | SILVER | BRONZE
4. Notifies candidates of class changes
5. Recruiter filters by class return correct results

### Testing Artifacts
- Unit tests for Goal, Application, Feedback services
- Component tests for priority routes (Living CV, Goals, Applications)
- E2E test: Full candidate journey (create goal → upload proof → class upgrade)
- Performance test: Living CV page loads under 2s with 100+ milestones
- API contract tests: Endpoint responses match model definitions

---

## Success Metrics (Phase 1-2)

### Phase 1 Metrics (Foundation)
- ✅ 100% of candidate goals visible in Living CV within 2 seconds
- ✅ Candidate class accuracy: 95%+ correct classification based on rules
- ✅ Proof upload: <30s for files up to 10MB (via S3)
- ✅ Privacy controls: 100% of candidates can set visibility preferences
- ✅ Application auto-logging: 80%+ of legitimate applications detected correctly
- ✅ Recruiter adoption: 90%+ of recruiters filter by candidate class within first month
- ✅ Alias generation: 100% of candidates have unique, persistent aliases

### Phase 2 Metrics (Monetization)
- ✅ Identity reveal workflow: <5s from request to unlock (for active subscribers)
- ✅ Subscription conversion: 30%+ of companies upgrade to PRO/ENTERPRISE within 3 months
- ✅ Reveal request completion rate: 85%+ of reveal requests result in unlocked identity
- ✅ Payment processing: 99.9%+ successful Stripe transactions
- ✅ Audit logging: 100% of reveals tracked with complete metadata
- ✅ Company subscription dashboard: <3s load time with quota indicators

### Phase 3 Metrics (Compliance & Scale)
- ✅ Audit report generation: <10s for monthly revenue reports
- ✅ Off-platform hire detection: Track candidate-reported violations
- ✅ Terms of Service acceptance: 100% of companies accept before first reveal
- ✅ System scalability: Support 10,000+ candidates, 1,000+ companies, 100+ reveals/day

---

## Quick Reference: Identity Reveal & Monetization Model

### How It Works (TL;DR)
1. **Candidates register** → System generates unique alias (e.g., "TechPro_4782")
2. **Candidates build Living CV** → Goals, proof, milestones visible under alias
3. **Companies browse anonymized profiles** → See alias, class badge, achievements
4. **Company requests identity reveal** → System checks subscription status:
   - **Subscribed:** Unlock immediately, track discounted placement fee (10-12%)
   - **Not subscribed:** Redirect to payment page for full placement fee (20-30%)
5. **Identity unlocked** → Company sees real name, email, contact info
6. **Audit logged** → Every reveal tracked for compliance and revenue reporting

### Why This Model Works
✅ **Defensible:** Alias system prevents candidates from bypassing platform  
✅ **Recurring Revenue:** Subscriptions provide predictable cash flow  
✅ **High Margin:** Contingency placements capture one-off hires at premium rates  
✅ **Candidate Trust:** Identity protected until companies transact  
✅ **Scalable:** Automated workflow requires minimal manual intervention  

### Implementation Phases
- **Phase 1:** Alias generation (US 1.3a) + basic privacy (US 1.5) + trust messaging (US 1.11)
- **Phase 2:** Reveal workflow (US 1.8) + subscription validation (US 1.9)
- **Phase 3:** Audit logging (US 1.10) + compliance enforcement

**See User Stories US 1.3a, 1.5, 1.8-1.11 for complete implementation details.**
