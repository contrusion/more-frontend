# Recruitment App Extension - Phase 1 Plan & User Stories

> Phase 1 builds the foundation — candidate profiles (Living CV, Goals, Milestones), the alias/zero-PII system, job ads, and basic recruiter search.

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
1. **Sprint 1-2 (Phase 1):** ✅ *COMPLETED*
   - ✅ Backend: Candidate Goals, Milestones, Alias generation (US 1.3a), Living CV endpoints (US 1.3)
   - ✅ Frontend: Goal management UI, Living CV display with aliases, `publicAlias` in all DTOs *Auto-tracking (system detects completion without manual input):*
  - **Streak challenges** — system tracks weekly milestone/goal activity; awards points when streak threshold is hit (e.g. "Log progress 10 consecutive weeks")
  - **Profile completeness challenges** — system recalculates profile completion % whenever a section is saved; auto-completes challenge when threshold is crossed (e.g. "Complete your profile to 80%")
  - **Certification count challenges** — auto-detected when a new certification is saved (e.g. "Add 3 verified certifications")
  - **Activity volume challenges** — e.g. "Add 5 proof items in a single month" — system counts proof items with `createdAt` in the window *Auto-tracking (system detects completion without manual input):*
  - **Streak challenges** — system tracks weekly milestone/goal activity; awards points when streak threshold is hit (e.g. "Log progress 10 consecutive weeks")
  - **Profile completeness challenges** — system recalculates profile completion % whenever a section is saved; auto-completes challenge when threshold is crossed (e.g. "Complete your profile to 80%")
  - **Certification count challenges** — auto-detected when a new certification is saved (e.g. "Add 3 verified certifications")
  - **Activity volume challenges** — e.g. "Add 5 proof items in a single month" — system counts proof items with `createdAt` in the window
2. **Sprint 2-3 (Phase 1 continued):** ✅ *COMPLETED*
   - ✅ Backend: Class calculation weekly batch (`CandidateClassScheduler`, `TwoGroupCandidateClassifier`)
   - ✅ Frontend: Candidate Pool UI (US-R3) — class badges, tier + experience filters, Living CV modal, recruiter sidebar layout
   - ⏳ Privacy controls (US 1.5) — deferred to Phase 1.5
3. **Sprint 3 (Phase 1):** ✅ *COMPLETED*
   - ✅ **US-C2:** `ClassBadgeDashboardComponent` — alias + tier badge + motivational message + next-step guidance on Living CV
   - ⏳ Privacy controls (US 1.5) — deferred to Phase 1.5
4. **Sprint 4 (Phase 1 — PARTIALLY COMPLETE):**
   - ✅ Scaffolding: Job Ads tile (home page, RECRUITER-only), `/recruiter/job-ads` route, `JobAdsListComponent`, `JobAdFormComponent`, and "Jobs" sidebar nav item
   - ✅ **US-R1 (creation flow implemented):** Recruiter job-ad / structured job-spec creation flow is in place
   - ⏳ **US-R2:** System matches job specs to Living CVs (match engine)
   - ⏳ **US-C1:** Candidate sees curated role feed + expresses interest under alias
   - **Implementation order remains:** US-R1 → US-R2 → US-C1 (recruiter spec creation → match engine → candidate opportunity feed)
   - **Important note:** the recruiter-side creation flow is complete; the full end-to-end matching and interest loop still remains pending
5. **Sprint 5 (Phase 1 continued):**
   - **US-R2:** System matches job specs to Living CVs (match engine)
   - **US-C1:** Candidate sees curated role feed + expresses interest under alias
   - **US-NAV1:** Global hamburger navigation drawer (all roles)
6. **Sprint 6 (Phase 2):**
   - Trust Layer: Onboarding tutorials, authenticity warnings (US 1.11)
   - Privacy controls (US 1.5)
7. **Sprint 7-8 (Phase 2):** done last to include all other features when determing monitization
   - Monetization Core: Identity reveal workflow (US 1.8), Stripe integration (US 1.9)
   - Company subscription dashboard, reveal request flow
   - Keycloak COMPANY role support
   - **Talent Search (US-R4):** Full registry search with keyword + role + industry + experience filters
8. **Sprint 8-9 (Phase 3):**
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

**US 1.1: Candidate Can Create Growth Goals** ✅ *Implemented*
- **As a** candidate
- **I want to** set measurable goals (e.g., "Complete Java Certification by June 30")
- **So that** recruiters can see I'm actively improving
- **Acceptance Criteria:**
  - ✅ Create goal with title, description, target date, category (skill, cert, project, etc.)
  - ✅ Goals persist in backend
  - ✅ Goals visible on candidate's public profile/Living CV
  - ✅ Can edit/delete own goals
  - ✅ Soft delete for historical tracking
- **Components Created:**
  - ✅ `CandidateGoalsComponent` (manage goals; `goals/candidate-goals.component.ts`)
  - ✅ `GoalFormComponent` (create/edit modal; `goals/goal-form/`)
  - ✅ `GoalCardComponent` (display single goal with status; `goals/goal-card/`)
- **Data Model:** Goal with status (Not Started, In Progress, Completed, Abandoned)
- **Implemented Endpoints:** POST/GET/PATCH/DELETE `/api/candidates/goals`

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

**US 1.3: Candidate Can View Their Living CV** ✅ *Implemented*
- **As a** candidate
- **I want to** see a dynamic, real-time view of my career profile (Living CV)
- **So that** I can understand how recruiters see me
- **Acceptance Criteria:**
  - ✅ Living CV displays: profile info, goals, proof, completed milestones, current class (Gold/Silver/Bronze)
  - ✅ Automatically updates when goals/milestones change
  - ✅ Shows structured sections: Work Experience, Education, Certifications, Skills, References
  - ✅ Clean, professional visual design
  - Privacy toggles — deferred to US 1.5
- **Components Created:**
  - ✅ `LivingCvComponent` (main display; `living-cv/living-cv.component.ts`)
  - ✅ `WorkExperienceComponent` (`work-experience/work-experience.component.ts`)
  - ✅ `EducationComponent` (`education/education.component.ts`)
  - ✅ `CertificationsComponent` (`certifications/certifications.component.ts`)
  - ✅ `SkillsComponent` (`skills/skills.component.ts`)
  - ✅ `ReferencesComponent` (`references/references.component.ts`)
- **Services Created:**
  - ✅ `LivingCvService`, `WorkExperienceService`, `EducationService`, `CertificationService`, `CandidateSkillService`, `ReferenceService`
- **Data Model:** Aggregates Goal, Milestone, WorkExperience, Education, Certification, Skill, Reference, and candidate profile data
- **Implemented Endpoints:** GET `/api/candidates/{id}/living-cv`

**US 1.3a: System Generates Anonymized Candidate Aliases** ✅ *Implemented* *(Technical Foundation)*
- **As a** system
- **I want to** auto-generate unique, professional aliases for candidates
- **So that** real identities remain hidden until companies transact
- **Acceptance Criteria:**
  - ✅ `publicAlias` column on `Applicant` entity — generated on registration
  - ✅ Alias returned in all recruiter-facing DTOs (`CandidateSearchResultDto`, `PublicLivingCvDto`)
  - ✅ Real name/email never exposed — `PublicLivingCvDto` enforces zero-PII contract
  - ✅ Alias persists; uniqueness enforced via DB unique constraint
  - Candidate alias settings page — deferred to US-C2
- **Implemented Endpoints:**
  - ✅ `GET /api/candidates/public/{alias}/living-cv` — RECRUITER-gated, returns `PublicLivingCvDto` (no PII)
  - ✅ All search results return `publicAlias` only
- **Phase:** Phase 1 (Foundation) - **Must come before reveal logic**

**US 1.4: System Calculates Candidate Class (All-Star/Gold/Silver/Bronze)** ✅ *Implemented*
- **As a** system
- **I want to** automatically classify candidates based on activity and career depth
- **So that** recruiters can prioritize high-performers
- **Acceptance Criteria:**
  - ✅ Two-group classification strategy (`TwoGroupCandidateClassifier`):
    - Group A (≥ 5 years): All-Star / Gold / Silver / Bronze tiers based on goals, proof items, recency
    - Group B (< 5 years): Gold / Silver / Bronze tiers with adjusted thresholds
  - ✅ Weekly recalculation via `CandidateClassScheduler`
  - ✅ `cachedClass` persisted on `Applicant` entity
  - ✅ Classification visible in Candidate Pool search results and Living CV
  - Candidate notification on class change — deferred to US-C2
- **Implemented Components:**
  - ✅ `TwoGroupCandidateClassifier` — classification logic
  - ✅ `CandidateClassScheduler` — weekly batch recalculation
  - ✅ `CandidateClassMessagingProvider` — recruiter-facing card messages and tooltips
  - ✅ `CandidateClassBadgeComponent` — reusable frontend badge with tier tooltip
- **Implemented Endpoints:** `cachedClass` returned in all candidate DTOs

**US 1.5: Candidate Can Manage Privacy & Visibility** *(Simplified)* ⏳ *Deferred to Phase 2*
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
- **Phase:** Phase 1.5 — *deferred; US-R3 and US-C2 take priority*

---

#### Epic: Application History & Feedback Aggregation (Phase 2)

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

#### Epic: Role Matching & Interest Expression (Phase 1) - will need other phases so that the match can also consider tier/scores/points

> **The Triad:** Recruiter (US-R1) creates structured job specs → System (US-R2) matches them to Living CVs → Candidate (US-C1) sees curated matches and expresses interest under alias → Recruiter reveal workflow (US 1.8) monetises the interaction. These three stories form a closed loop: recruiters get structured, high-quality signals; candidates get curated, motivating opportunities; the platform enforces alias + reveal, protecting trust and driving monetisation.
>
> **Terminology note:** in this roadmap, “job ad” and “job spec” are used interchangeably to refer to the same recruiter-created role definition. The implementation in the app uses the job-ad model and form, while the story language refers to the same concept as a structured “job specification”.

**US-R1: Recruiter Creates Structured Job Specification**
- **As a** recruiter
- **I want to** create a job specification using structured fields (skills, certifications, experience level, proof signals, activity recency)
- **So that** the system can accurately match candidates' Living CVs to my role requirements
- **Acceptance Criteria:**
  - Recruiter fills out job spec form with controlled vocabularies (skills, certifications, years of experience, role type)
  - Recruiter can mark requirements as must-have or nice-to-have
  - Job spec data maps directly to Living CV fields (Goals, Proof Items, Candidate Class, Experience)
  - System validates form completeness before posting
  - Alias-based candidate matching is enforced (no real identities exposed)
- **Components to Create:**
  - `JobSpecFormComponent` (structured fields, toggles for must-have/nice-to-have; `recruiter/job-spec/job-spec-form/`)
  - `JobSpecPreviewComponent` (review before posting; `recruiter/job-spec/job-spec-preview/`)
- **Services to Create:**
  - `JobSpecService` (CRUD for job specifications)
- **Data Model:**
  ```typescript
  JobSpecification {
    id: string
    recruiterId: string
    roleTitle: string
    requiredSkills: string[]
    preferredCertifications: string[]
    experienceLevel: string
    mustHave: string[]
    niceToHave: string[]
    activityRecency: number          // days
    createdAt: Date
  }
  ```
- **Estimated Endpoints:**
  - `POST /api/recruiters/{id}/job-specs` — Create job specification
  - `GET /api/recruiters/{id}/job-specs` — List recruiter's job specs
  - `PATCH /api/recruiters/{id}/job-specs/{specId}` — Update job spec
  - `DELETE /api/recruiters/{id}/job-specs/{specId}` — Delete job spec
- **Phase:** Phase 1 — **Must come before US-R2 (matching)**
- **Dependencies:** US 1.3 (Living CV fields exist to match against)

**US-R2: System Matches Job Ads to Living CVs**
- **As a** system
- **I want to** automatically match recruiter job advertisements to candidate Living CVs
- **So that** candidates only see curated, relevant opportunities and recruiters receive filtered, high-quality signals
- **Acceptance Criteria:**
  - System compares job spec fields against Living CV data (Goals, Proof Items, Candidate Class, Experience)
  - Candidates see only roles where their Living CV aligns with must-have requirements
  - Candidates can express interest under their alias (no identity reveal yet)
  - Recruiters see alias + Living CV snapshot when candidates show interest
  - Reveal workflow triggers if recruiter wants to unlock candidate identity (US 1.8)
- **Components to Create:**
  - `CandidateOpportunityFeedComponent` (curated role list for candidates; `candidate/opportunities/`)
  - `AliasInterestButtonComponent` (candidate expresses interest without revealing identity; `candidate/opportunities/alias-interest-button/`)
  - `MatchedCandidateCardComponent` (recruiter sees alias + Living CV snapshot; `recruiter/matches/`)
- **Services to Create:**
  - `RoleMatchEngineService` (backend matching logic — compares job spec fields to Living CV)
  - `OpportunityFeedService` (frontend service to fetch curated roles for candidate)
- **Data Model:**
  ```typescript
  RoleMatch {
    jobSpecId: string
    candidateAlias: string
    matchScore: number
    mustHaveMatched: string[]
    niceToHaveMatched: string[]
    lastUpdated: Date
  }
  ```
- **Estimated Endpoints:**
  - `GET /api/candidates/{id}/opportunities` — Curated role feed for candidate (matches by Living CV)
  - `POST /api/job-specs/{specId}/interest` — Candidate expresses interest under alias
  - `GET /api/recruiters/{id}/job-specs/{specId}/interested-candidates` — Recruiter sees interested aliases + CV snapshots
  - `GET /api/job-specs/{specId}/matches` — System-computed matches for a job spec
- **Phase:** Phase 1 — **Together with US-R1 this closes the matching loop**
- **Dependencies:** US-R1 (job spec exists), US 1.3 (Living CV exists), US 1.3a (alias system)

**US-C1: Candidate Sees Roles They'll Qualify For & Expresses Interest**
- **As a** candidate
- **I want to** see the roles my Living CV makes me eligible for — including roles I'm close to qualifying for — and express interest under my alias
- **So that** I'm motivated to keep improving, recruiters discover me based on verified growth signals, and my real identity is protected until the right moment
- **Acceptance Criteria:**
  - Candidate dashboard shows two sections:
    - **"Roles You Qualify For"** — roles where Living CV already meets must-have requirements
    - **"Potential Roles"** — roles where one or two gaps remain, with a specific action to close each gap
  - Each role card shows alias-safe details: role title, required skills, certifications, match score, and — for Potential Roles — a contextual nudge (e.g. *"Finish your Java milestone to become eligible for 12 potential backend roles"*)
  - Gap nudges are specific and actionable, not generic (e.g. *"Completing your AWS Certification will qualify you for Cloud Engineer roles"*, *"Update your Living CV to surface more opportunities recruiters are looking for"*)
  - Candidate can click **"Show Interest"** on any qualifying role, sending an alias-based signal to the recruiter — no identity exposed
  - Candidate's real identity remains hidden until the recruiter initiates the reveal workflow (US 1.8)
  - Candidate receives a notification when a recruiter views their interest or requests a reveal
- **UX Copy Guidelines (enforced in component templates):**
  - Use *"Potential Roles"* or *"Roles You'll Qualify For"* — never "Unlock"
  - Gap nudge pattern: *"[Complete X] to [become eligible for / qualify for] [N] [role type] roles"*
  - Forward-looking framing: *"Future Opportunities"* for roles that require more growth
  - Action-oriented but realistic: *"Roles You'll Be Ready To Apply For"* for near-miss matches
- **Components to Create:**
  - `OpportunityFeedComponent` (two-section layout: qualifying + potential; `candidate/opportunities/opportunity-feed/`)
  - `RoleMatchCardComponent` (role details, match score, eligibility status; `candidate/opportunities/role-match-card/`)
  - `GapNudgeComponent` (contextual, specific action prompts per gap; `candidate/opportunities/gap-nudge/`)
  - `AliasInterestButtonComponent` (express interest without revealing identity; `candidate/opportunities/alias-interest-button/`)
- **Services to Create:**
  - `OpportunityFeedService` (fetch qualifying + potential roles; extends `RoleMatchEngineService`)
  - `CandidateInterestService` (submit and track interest signals)
- **Data Model:**
  ```typescript
  CandidateInterest {
    id: string
    candidateAlias: string
    jobSpecId: string
    expressedAt: Date
    status: InterestStatus           // PENDING | VIEWED | REVEAL_REQUESTED
  }

  RoleMatch {
    jobSpecId: string
    candidateAlias: string
    matchScore: number
    eligibilityStatus: EligibilityStatus  // QUALIFIES | POTENTIAL | FUTURE
    mustHaveMatched: string[]
    mustHaveGaps: string[]           // Fields candidate still needs to meet
    niceToHaveMatched: string[]
    gapNudge?: string                // E.g. "Complete AWS Cert to qualify for Cloud Engineer roles"
    lastUpdated: Date
  }

  enum EligibilityStatus {
    QUALIFIES     // All must-haves met — show in "Roles You Qualify For"
    POTENTIAL     // 1-2 gaps remain — show in "Potential Roles" with gap nudge
    FUTURE        // More than 2 gaps — show in "Future Opportunities" (motivational only)
  }
  ```
- **Estimated Endpoints:**
  - `GET /api/candidates/{id}/opportunities` — Curated feed grouped by eligibility status (shared with US-R2)
  - `POST /api/job-specs/{specId}/interest` — Express interest under alias (shared with US-R2)
  - `GET /api/candidates/{id}/interests` — Candidate tracks their submitted interest signals
  - `GET /api/candidates/{id}/interests/{interestId}/notifications` — Status updates from recruiter
- **Phase:** Phase 1 — **Completes the triad with US-R1 and US-R2**
- **Dependencies:** US-R2 (match engine computes eligibility + gaps), US 1.3a (alias system enforces identity hiding)

---

#### Epic: Class Visibility & Candidate Engagement Messaging (Phase 1)

> **Context:** US 1.4 calculates and stores `CandidateClass` (All-Star, Gold, Silver, Bronze). These two stories wire that class value into recruiter search UX and candidate dashboard UX with structured messaging. They depend on US 1.3a (alias) and US 1.4 (class calculation) being complete.

**US-R3: Recruiter Sees Class Messaging in Candidate Search Results** ✅ *Implemented*
- **As a** recruiter using the More Opportunities platform
- **I want to** see clear class labels (All-Star, Gold, Silver, Bronze) with explanatory messaging in search results, candidate cards, and tooltips
- **So that** I can quickly understand a candidate's activity level, career depth, and readiness without needing to reveal their identity prematurely
- **Acceptance Criteria:**
  - ✅ Recruiter search results display candidate alias + class badge
  - ✅ Hovering over the badge shows a static tier-definition tooltip (per-class description)
  - ✅ Activity Status column shows candidate-specific `classTooltip` text (truncated 50 chars)
  - ✅ Recruiters can filter by class (All / All-Star / Gold / Silver / Bronze) AND experience group (All / < 5 Years / 5+ Years) — filters combine with AND
  - ✅ Real names/emails not returned — `CandidateSearchResultDto` enforces zero-PII contract
  - ✅ Living CV modal: clicking "View CV" opens `PublicLivingCv` with stats, experience, education, skills, certifications
- **Messaging Matrix (Recruiter-Facing):**

  | Class | Search Results (List View) | Candidate Card Message | Tooltip / Hover Message |
  |---|---|---|---|
  | All-Star ⭐ | Alias + `⭐ All-Star` badge | "All-Star: actively growing and deeply experienced." | "This candidate has 5+ years of career depth, 10+ proof items, and is actively logging new goals. Elite tier." |
  | Gold 🥇 | Alias + `🥇 Gold` badge | "Gold: either actively growing or already career-proven." | "This candidate meets either activity-driven criteria (recent goals/proof) or career-depth criteria (solid track record)." |
  | Silver 🥈 | Alias + `🥈 Silver` badge | "Silver: developing profile with moderate activity or career proof." | "This candidate is building momentum—some goals/proof, moderate experience. Emerging talent." |
  | Bronze 🥉 | Alias + `🥉 Bronze` badge | "Bronze: early-stage or currently inactive." | "This candidate has limited goals/proof or hasn't updated recently. Entry-level or dormant profile." |

- **Implemented Components:**
  - ✅ `CandidateSearchComponent` (`recruiter/candidate-search/`) — gradient header, filter section, table, pagination
  - ✅ `CandidateClassBadgeComponent` (`shared/components/candidate-class-badge/`) — reusable badge with tier tooltip
  - ✅ `RecruiterLayoutComponent` — 80px dark sidebar, single "Pool" nav item
  - `CandidateCardComponent` / `ClassFilterComponent` — not needed; filters built into `CandidateSearchComponent`
- **Implemented Services:**
  - ✅ `CandidateSearchService` — `searchCandidates(classFilter, experienceGroup, page)`, sends `candidateClass` + `experienceGroup` params
  - ✅ `LivingCvService.getPublicLivingCv(alias)` — fetches `PublicLivingCv` for modal
- **Implemented Data Model:**
  ```typescript
  CandidateSearchResult {
    publicAlias: string
    candidateClass: CandidateClass       // ALL_STAR | GOLD | SILVER | BRONZE
    experienceGroup: ExperienceGroup | null  // EARLY_CAREER | EXPERIENCED
    roleCategory: string
    jobTitle: string | null
    industry: string | null
    classCardMessage: string             // Recruiter card narrative
    classTooltip: string                 // Activity status text
  }
  ```
- **Implemented Endpoints:**
  - ✅ `GET /api/recruiters/candidates?candidateClass=GOLD&experienceGroup=EXPERIENCED&page=0&size=20`
  - ✅ `GET /api/candidates/public/{alias}/living-cv` — powers Living CV modal
- **Phase:** Phase 1
- **Dependencies:** US 1.3a (alias system), US 1.4 (class calculation), US 1.3 (public Living CV endpoint)

---

**US-C2: Candidate Sees Motivational Class Messaging on Dashboard** ✅ *Implemented*
- **As a** candidate building my Living CV
- **I want to** see my current class badge (All-Star, Gold, Silver, Bronze) with motivational messaging and guidance
- **So that** I understand how recruiters perceive me and what steps I can take to climb to the next tier
- **Acceptance Criteria:**
  - ✅ Living CV shows alias + tier badge + motivational message per class
  - ✅ Each class has a tailored motivational message and a specific next-step action
  - ✅ Messaging is positive, career-stage aware, and forward-looking
  - Progress tracker (`ClassProgressTrackerComponent`) — deferred to a follow-up
  - Nudge notifications (`ClassNudgeNotificationComponent`) — deferred to Phase 1.5
- **Messaging Matrix (Candidate-Facing):**

  | Class | Dashboard Badge | Motivational Message | Next Step Guidance |
  |---|---|---|---|
  | All-Star ⭐ | `⭐ All-Star` | "You're All-Star: recruiters see you as actively growing and deeply experienced. You're at the very top of the talent pool." | Keep logging new goals and proof items to maintain your elite status. |
  | Gold 🥇 | `🥇 Gold` | "You've reached Gold: recruiters see you as career-proven or actively growing. You're a trusted candidate." | Add more proof items or update goals regularly to aim for All-Star. |
  | Silver 🥈 | `🥈 Silver` | "You're Silver: recruiters see you as developing your profile. You're building momentum." | Log at least one new goal and proof item this month to move up to Gold. |
  | Bronze 🥉 | `🥉 Bronze` | "You're Bronze: recruiters see you as early-stage or currently inactive. This is your starting point." | Add proof items and set goals to climb into Silver and beyond. |

- **Implemented Components:**
  - ✅ `ClassBadgeDashboardComponent` (`living-cv/class-badge-dashboard/`) — alias + badge + motivational message + next-step card; tier-accented left border; embedded in `LivingCvComponent` as first panel
  - ✅ *(Reuses `CandidateClassBadgeComponent` from US-R3 for the badge itself)*
  - `ClassProgressTrackerComponent` — deferred
  - `ClassNudgeNotificationComponent` — deferred to Phase 1.5
- **Implemented Endpoints:** None — `candidateClass` and `publicAlias` already returned in `GET /api/candidates/living-cv`
- **Phase:** Phase 1
- **Dependencies:** US 1.4 (class field on Living CV response), US 1.3a (alias visible on dashboard)

---

**US-C3: System Issues Discovery Vitality-Style (Don't use the word vitality, chose something else) Goal Challenges to Candidates** ✅ *Implemented*
- **As a** candidate building my Living CV
- **I want to** see a set of system-issued goal challenges (like Discovery Vitality goals) that I can work toward — each with clear completion criteria, automatic progress tracking where possible, and points awarded on completion
- **So that** I know exactly what the platform values, my growth is measured consistently across all candidates, and I am motivated by visible progress toward tier milestones

- this is different from: za.co.contrusion.apis.more.candidate.domain.CandidateGoal. What we have in this US is challenges.
> **Model:** The system presents challenges — candidates do not create them. Think Discovery Vitality: *"Reach your weekly active points 10 consecutive weeks"*, *"Add a verified certification this quarter"*, *"Complete your profile to 100%"*. Candidates opt in to a challenge or are auto-enrolled when eligible. Progress is tracked automatically wherever the system can detect it; only where it cannot is manual proof required.

- **Acceptance Criteria:**

  *Challenge feed:*
  - Candidate sees a **"Challenges"** section on their dashboard distinct from their custom goals (US 1.1)
  - Challenges are displayed as cards: title, description, completion criteria, reward points, progress indicator, deadline (if time-boxed)
  - Challenge states: `AVAILABLE` / `IN_PROGRESS` / `COMPLETED` / `EXPIRED`
  - Candidate can **opt in** to an `AVAILABLE` challenge; once opted in it moves to `IN_PROGRESS`
  - Some challenges are **auto-enrolled** on trigger (e.g. "Maintain a 4-week milestone streak" activates automatically when the system detects the first week of activity)
  - Completed challenges show a ✅ badge and the points awarded; they remain visible as a trophy record

  *Auto-tracking (system detects completion without manual input):*
  - **Streak challenges** — system tracks weekly milestone/goal activity; awards points when streak threshold is hit (e.g. "Log progress 10 consecutive weeks")
  - **Profile completeness challenges** — system recalculates profile completion % whenever a section is saved; auto-completes challenge when threshold is crossed (e.g. "Complete your profile to 80%")
  - **Certification count challenges** — auto-detected when a new certification is saved (e.g. "Add 3 verified certifications")
  - **Activity volume challenges** — e.g. "Add 5 proof items in a single month" — system counts proof items with `createdAt` in the window
  - ** Skill verification challange**
  - ** Responsiveness Challenge*

  *Proof-required challenges (system cannot auto-detect):*
  - **Externally verified achievements** — e.g. "Pass an industry-recognised assessment" — candidate uploads certificate or badge; proof enters `PENDING` verification (lazy model, consistent with US 1.2)
  - Proof upload uses the same `MilestoneProofItem` model already in place
  - Proof requirement is declared on the `GoalChallenge` template: `requiresProof: boolean`, `acceptedProofTypes: ProofType[]`

  *Points & tier impact:*
  - Each challenge has a system-assigned `rewardPoints` value (set by admin on the template)
  - Points awarded on completion feed directly into the Market Readiness Score (Phase 2 — US-P1)
  - Challenge completions are weighted more heavily than custom goal completions in the score calculation
  - Candidates near a tier threshold see a nudge: *"Complete 'Log progress 8 consecutive weeks' (+40 pts) to reach Silver"*

  *Recruiter visibility:*
  - Completed challenges appear on the candidate's public Living CV as a **"Challenges Completed"** section (alias-safe; no PII)
  - Challenge title and points shown; proof detail not exposed publicly

  *Admin control:*
  - Admin creates and manages the challenge library via **US-A26** in Admin Phase 1 — this is a dedicated story specifically for peer differentiation challenges (distinct from US-A22 which manages Career Pathways for career-gap filling)
  - Each template has: title, description, category, `trackingType` (`AUTO` / `PROOF_REQUIRED`), `triggerEvent` (for auto-enrol), `completionCriteria`, `rewardPoints`, `allStarPoints` (Active Excellence points), `validityDays` (null = no expiry), `active`
  - For `SKILL_SPRINT` challenges, admin defines **structured milestone steps** with target days/weeks and optional linked assessments — passing the assessment auto-completes that milestone
  - Admin can retire a challenge (existing `IN_PROGRESS` entries run to natural completion; no new enrolments)

- **Challenge Examples:**

  | Challenge | Tracking | Reward | Notes |
  |-----------|----------|--------|-------|
  | "Log progress every week for 10 consecutive weeks" | AUTO — streak tracker | +80 pts | Resets if a week is missed |
  | "Complete your Living CV profile to 100%" | AUTO — profile completeness | +100 pts | One-time |
  | "Add 3 verified certifications" | AUTO — certification count | +120 pts | Cumulative; awards when 3rd cert is saved |
  | "Add 5 proof items in a single month" | AUTO — proof item count in window | +60 pts | Resets monthly |
  | "Pass an industry-recognised assessment" | PROOF — certificate upload | +150 pts | Manual proof; lazy verification |
  | "Add a testimonial reference from a manager or client" | PROOF — reference added | +80 pts | One-time per reference type |
  | "Update your Living CV after a career event (new role, cert, project)" | AUTO — CV section updated within 14 days of a date-field event | +40 pts | Recurring; re-awards each time |
  | "Reach Silver tier for the first time" | AUTO — tier promotion event | +200 pts | Milestone bonus |

- **Components to Create / Update:**
  - `ChallengeFeedComponent` (`candidate/challenges/challenge-feed/`) — grid of challenge cards grouped by state (In Progress / Available / Completed)
  - `ChallengeCardComponent` (`candidate/challenges/challenge-card/`) — title, criteria, progress bar (auto-tracked) or proof upload button (proof-required), reward points, deadline countdown
  - `ChallengeProofUploadComponent` (`candidate/challenges/challenge-proof-upload/`) — reuses `MilestoneProofItem` model; only shown for `PROOF_REQUIRED` challenges
  - `ChallengeStreakTrackerComponent` (`candidate/challenges/challenge-streak-tracker/`) — weekly activity calendar strip (e.g. 10 circles, filled = active week)
  - `ChallengeNudgeComponent` (`shared/components/challenge-nudge/`) — inline nudge card surfaced on dashboard when candidate is within N points of a tier; links directly to the highest-value incomplete challenge
  - Update `GoalsPageComponent` (or `DashboardComponent`) to include the Challenges section as a peer panel alongside custom goals

- **Backend changes required:**
  - New entity: `GoalChallenge (id, title, description, category, trackingType [AUTO|PROOF_REQUIRED], triggerEvent, completionCriteria [JSON], rewardPoints, validityDays, acceptedProofTypes[], active)` — admin-managed
  - New entity: `CandidateChallengeEnrolment (id, candidateId, challengeId, status [AVAILABLE|IN_PROGRESS|COMPLETED|EXPIRED], progressSnapshot [JSON], enrolledAt, completedAt, proofItemId [nullable], pointsAwarded)`
  - `CandidateClassScheduler` (and later `MarketReadinessCalculator` — US-P1) weights challenge completions more heavily than custom goals
  - Auto-tracking listeners:
    - `MilestoneSavedEvent` → update streak progress on active streak challenges
    - `CertificationSavedEvent` → check certification-count challenges
    - `ProofItemSavedEvent` → check proof-volume challenges
    - `ProfileSectionUpdatedEvent` → recalculate profile completeness challenges
    - `TierPromotionEvent` → award milestone bonus challenges
  - Endpoints:
    - `GET /api/challenges` — active challenges available for the candidate (enrolled state merged in)
    - `POST /api/candidates/me/challenges/{challengeId}/enrol` — opt in to a challenge
    - `POST /api/candidates/me/challenges/{challengeId}/proof` — submit proof for `PROOF_REQUIRED` challenge (creates `MilestoneProofItem`)
    - `GET /api/candidates/me/challenges` — candidate's full enrolment list with progress
    - `GET /api/admin/challenges` — admin: full challenge library
    - `POST /api/admin/challenges` — admin: create challenge template
    - `PATCH /api/admin/challenges/{id}` — admin: edit or retire

- **Data Model:**
  ```typescript
  GoalChallenge {
    id: string
    title: string                       // e.g. "Log progress 10 consecutive weeks"
    description: string
    category: ChallengeCategory         // ACTIVITY | PROFILE | CERTIFICATION | ASSESSMENT | MILESTONE
    trackingType: TrackingType          // AUTO | PROOF_REQUIRED
    triggerEvent?: string               // Event name that auto-enrols candidate (e.g. 'FIRST_MILESTONE_SAVED')
    completionCriteria: object          // e.g. { streakWeeks: 10 } or { certCount: 3 }
    rewardPoints: number
    validityDays?: number               // null = no expiry
    acceptedProofTypes?: ProofType[]    // only for PROOF_REQUIRED
    active: boolean
  }

  CandidateChallengeEnrolment {
    id: string
    candidateId: string
    challengeId: string
    status: ChallengeStatus             // AVAILABLE | IN_PROGRESS | COMPLETED | EXPIRED
    progressSnapshot: object            // e.g. { currentStreak: 6, target: 10 }
    enrolledAt: Date
    completedAt?: Date
    proofItemId?: string                // FK to MilestoneProofItem for PROOF_REQUIRED
    pointsAwarded: number
  }
  ```

- **Phase:** Phase 2
- **Dependencies:** US 1.3 (goals/milestones exist as event sources for auto-tracking), US 1.4 (class calculation scheduler), US-C2 (class messaging in place), US-P1 (Market Readiness Score — challenges feed into points engine)

---

#### Epic: Talent Search — Full Registry Browse (Phase 2)

> **Context:** The Candidate Pool (US-R3) surfaces only pre-classified, vetted talent. Talent Search is the complementary search-first tool that exposes the full registered candidate base — including unclassified applicants who have not yet earned a class. This matters for recruiters who want to discover early-stage candidates, reach into a broader pool, or search by role and industry rather than tier.
>
> **Candidate Pool vs Talent Search distinction:**
> - **Candidate Pool** — browse-first, class-filtered, classified candidates only. Living CV modal. Route: `/recruiter/candidates`
> - **Talent Search** — search-first, keyword + role + experience filters, all registered candidates (class shown where available). Route: `/search`

**✅ US-R4: Recruiter Can Search the Full Candidate Registry**
- **As a** recruiter (Talent Search - there's already a tile under 'Quick Access')
- **I want to** search across all registered candidates by keyword, role, industry, and experience level — not just those with a class assigned
- **So that** I can discover early-stage talent, fill niche roles, and broaden my pipeline beyond the curated Candidate Pool
- **Acceptance Criteria:**
  - Search bar accepts free-text (matched against role category, job title, industry)
  - Filters: Role Category, Industry, Experience Group (< 5 years / 5+ years), Class (All-Star / Gold / Silver / Bronze / Unclassified)
  - Results include all candidates with a `publicAlias`, including those with no class assigned
  - Unclassified candidates display a neutral "Unclassified" badge — no tier colour
  - Class badge shown where assigned; tooltip explains tier (same as Candidate Pool badge)
  - Results are paginated (20 per page, sorted by last-updated descending by default)
  - Clicking a result opens the Living CV modal (same `PublicLivingCv` endpoint as Candidate Pool)
  - No PII returned — alias only until reveal workflow (US 1.8)
- **UX distinction from Candidate Pool:**
  - Candidate Pool: filter-pill UI, assumes recruiter is browsing; starts with full list
  - Talent Search: search-bar-first UI, results appear after input; broader and less curated
- **Components to Create:**
  - `TalentSearchComponent` (search bar + combined filter bar + results table; `recruiter/talent-search/talent-search.component.ts`)
  - Reuse `CandidateClassBadgeComponent` for tier badges
  - Reuse Living CV modal pattern from `CandidateSearchComponent`
- **Services to Create / Update:**
  - Extend `CandidateSearchService.searchCandidates()` to accept `keyword`, `roleCategory`, `industry` params — OR create a dedicated `TalentSearchService` if query shape diverges significantly
- **Backend changes required:**
  - New optional `keyword`, `roleCategory`, `industry` query params on `GET /api/recruiters/candidates`
  - `candidateClass` filter must accept `UNCLASSIFIED` as a sentinel (or `classAssigned=false` param) to explicitly filter to candidates with no class
  - `CandidateSearchResultDto` — no structural change needed; `candidateClass` can be `null` for unclassified results
- **Data Model changes:**
  ```typescript
  // candidateClass is already nullable on CandidateSearchResult
  // Add to frontend model:
  type ClassFilterExtended = CandidateClass | 'UNCLASSIFIED' | null;

  // New search params:
  interface TalentSearchParams {
    keyword?: string;
    roleCategory?: string;
    industry?: string;
    candidateClass?: ClassFilterExtended;
    experienceGroup?: ExperienceGroup;
    page: number;
    size: number;
  }
  ```
- **Estimated Endpoints:**
  - `GET /api/recruiters/candidates?keyword=java&roleCategory=BACKEND&industry=Fintech&page=0&size=20`
  - `GET /api/recruiters/candidates?classAssigned=false&page=0&size=20` — unclassified-only filter
- **Phase:** Phase 2 — **Candidate Pool (US-R3) must be stable before Talent Search is built**
- **Dependencies:** US-R3 (Candidate Pool established; `CandidateClassBadgeComponent` and Living CV modal reusable), US 1.3a (alias system)

---

#### Epic: Identity Reveal & Monetization (Phase 2)

> **⚠️ Backend Security Pre-Condition (already implemented — US 1.3a)**
>
> The anonymization layer is already enforced server-side. As of US 1.3a:
> - `GET /api/candidates/living-cv` (`APPLICANT` only) — returns full `LivingCvDto` with real name, social URLs, referee contacts.
> - `GET /api/candidates/public/{alias}/living-cv` (`RECRUITER` only) — returns `PublicLivingCvDto` with **zero PII**: no real name, no LinkedIn/portfolio URL, no profile image, no referee fullName/email/phone.
>
> The reveal endpoint **does not yet exist**. When US 1.8 is implemented, the following items must be updated to wire the reveal response through the security layer:
>
> **Backend (more-api) — must create/update:**
> - New `RevealedLivingCvDto` (or reuse `LivingCvDto`) — returned only after payment/subscription validated.
> - `POST /api/companies/{id}/reveal-requests` — creates a `RevealAuditLog` row before returning any identity fields; reject if subscription/payment check fails.
> - `ILivingCvService.getRevealedLivingCv(String candidateAlias, String companyId)` — validates reveal authorization, writes audit log, then returns real-name DTO.
> - `LivingCvController` — new `COMPANY` / `RECRUITER`-role endpoint that calls the above; must **never** return `LivingCvDto` directly to a recruiter without going through this method.
> - `RevealAuditLog` entity + Flyway migration — log every reveal with companyId, candidateId, timestamp, pathway, fee.
> - Stripe webhook handler to confirm payment before reveal is served.
>
> **Frontend (more-frontend) — must update:**
> - `MatchedCandidateCardComponent` — currently shows alias only; add "Request Reveal" button (only visible post-interest, post-match).
> - `IdentityRevealButtonComponent` (new) — triggers reveal request; shows subscription pathway or payment redirect.
> - `RevealRequestListComponent` (new, candidate-facing) — candidate sees who has requested their reveal.
> - Any service that calls `/api/candidates/public/{alias}/living-cv` must **not** be reused for the reveal path; a separate `RevealService` should call the reveal endpoint.

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
  - **Pre-condition:** `RevealAuditLog` must be written atomically with the reveal response — the backend must never return real identity fields unless the audit log write succeeds (wrap in a single transaction).
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

### **Story Breakdown Summary: Recruitment Foundation & Follow-On Roadmap**

> This summary includes the full recruitment story set: the Phase 1 foundation stories that unlock the product, then the Phase 1.5/2/3 follow-on work that builds trust, workflow automation, and monetization.
>
> **Status note:** the recruiter-side job specification / job-ad creation flow is already implemented in the app. In this roadmap, “job ad” and “job spec” are interchangeable names for the same recruiter-created role definition. The matching and candidate interest loop (US-R2 + US-C1) is now implemented and reflects the completed recruitment triad.
>
> **Workflow check:** there is no new story required for the Talent Search → shortlist → reveal flow. The existing story chain is: **US-R4 (Talent Search)** → **US-R6 (Applicant shortlist / view CV)** → **US 1.8 (Identity Reveal)**. Only the final reveal/monetization step remains a distinct follow-on story.

| Story | Focus | Phase | Dependencies | Estimated Effort |
|-------|-------|-------|--------------|------------------|
| **US-R1** | Recruiter creates structured job spec (creation flow implemented) | Phase 1 ✅ partial | US 1.3 | 1 sprint |
| **✅ US-R2** | System matches job specs to Living CVs | Phase 1 ✅ Implemented | US-R1, US 1.3, US 1.3a | 1 sprint |
| **✅ US-C1** | Candidate sees curated roles + expresses interest | Phase 1 ✅ Implemented | US-R2, US 1.3a | 1 sprint |
| **US 1.3a** | Technical: Alias generation | Phase 1 ✅ | None | 1 sprint |
| **US-R3** | Recruiter sees class messaging | Phase 1 ✅ | US 1.3a, US 1.4, US 1.3 | 1 sprint |
| **US-C2** | Candidate sees motivational class messaging | Phase 1 ✅ | US 1.4, US 1.3a | 0.5 sprint |
| **✅ US-C3** | Candidate: weighted goals with proofs | Phase 2 ✅ Done | US 1.3, US 1.4, US-C2 | 1.5 sprints |
| **US 1.5** | UX: Privacy settings (simplified) | Phase 1.5 ⏳ | US 1.3 | 1 sprint |
| **US 1.11** | UX: Trust messaging | Phase 1.5 | US 1.3a | 0.5 sprint |
| **✅ US-R4** | Recruiter: Talent Search — full registry | Phase 2 ✅ Implemented | US-R3, US 1.3a | 1 sprint |
| **US-R5** | Job Ad: Company Alumni multi-select from Companies table | Phase 2 | US-R1, Companies table | 1 sprint |
| **✅ US-R6** | Recruiter: View applicants who expressed interest + their CVs | Phase 2 ✅ Implemented | US-R1, US-C1, US 1.3a | 1 sprint |
| **US-H1** | UX: Dynamic & Personalised Quick Access (all roles) | Phase 2 | Home component stable | 1 sprint |
| **US 1.8** | Business: Reveal workflow | Phase 2 | US 1.3a, 1.5 | 2 sprints |
| **US 1.9** | Payment: Subscription validation | Phase 2 | US 1.8, Stripe setup | 2 sprints |
| **US 1.10** | Compliance: Audit logging | Phase 3 | US 1.8, 1.9 | 1 sprint |

---

#### US-H1: Dynamic & Personalised Quick Access (Phase 2)

**As a** user of the More platform (any role: APPLICANT, RECRUITER, MO_ADMIN),
**I want** the "Quick Access" section on my home screen to adapt to how I actually use the app, and to let me customise it myself,
**So that** the features I reach most are always one click away — not buried under a generic static list.

**Acceptance Criteria:**

*Behaviour — learning mode:*
- Every time a user navigates to a section via a Quick Access tile or the sidebar, the platform records that navigation event (route + timestamp + userId) in the backend.
- After a user has accumulated enough events (threshold: 10+ navigation events), the platform computes a "top 5 most visited" list and surfaces that as the user's personalised Quick Access order.
- New items that the user starts visiting frequently bubble up automatically; items the user never visits sink below the fold (collapsed into a "More" expander).
- Learning updates run on login or on a lightweight debounce (e.g. recalculate after every 5th navigation event).

*Behaviour — customisation mode:*
- A "Customise" button (pencil icon) appears in the Quick Access section header.
- Clicking it opens an edit mode: tiles become draggable; the user can reorder, pin, or hide any tile.
- Pinned tiles always appear first and are immune to the learning algorithm's reordering.
- Hidden tiles disappear from Quick Access but remain accessible via main navigation.
- A "Reset to defaults" option reverts both manual customisations and learned order.

*Role awareness:*
- The available tile set is still filtered by role (APPLICANT tiles are never shown to RECRUITER users etc.); only the order and visibility within the user's allowed set are personalised.
- If a role change adds new tiles, those appear at the bottom of Quick Access (unranked) until the learning algorithm or user promotes them.

*Persistence:*
- Customisation choices (pinned tiles, hidden tiles, manual order) persist in the backend against the user's profile — not just localStorage — so they survive device changes.
- Learned order is stored server-side as a ranked tile list, recalculated periodically.

**Components to Create / Update:**
- `QuickAccessSectionComponent` (replaces the static tile grid in `HomeComponent`; supports edit mode, drag-to-reorder, pin/hide per tile)
- `TileCustomiseModalComponent` (full-screen or panel edit mode: draggable tile list, toggle visibility, drag handle, "Reset" button)
- `QuickAccessService` (fetches personalised tile config from backend; POST navigation events; PUT custom order)

**Backend changes required:**
- New entity: `UserNavigationEvent (id, userId, route, visitedAt)` — append-only log, 90-day retention.
- New entity: `UserQuickAccessConfig (userId, tileId, pinned, hidden, manualOrder)` — one row per tile per user.
- Endpoint: `POST /api/users/me/navigation-events` — record a navigation event (called silently from `QuickAccessService` and sidebar service).
- Endpoint: `GET /api/users/me/quick-access` — returns ordered tile list (merged: manual pins first → learned order → defaults for unvisited tiles).
- Endpoint: `PUT /api/users/me/quick-access` — save full custom configuration (pinned, hidden, manual order).
- Endpoint: `DELETE /api/users/me/quick-access` — reset to defaults.
- Background job (or on-demand): recalculate learned order from `UserNavigationEvent` aggregate.

**Data Model:**
```typescript
QuickAccessTile {
  tileId: string               // Stable identifier e.g. 'interactions', 'jobs', 'recruiter-job-ads'
  title: string
  description: string
  icon: string
  route: string
  color: string
  pinned: boolean              // User explicitly pinned this tile
  hidden: boolean              // User explicitly hid this tile
  manualOrder?: number         // User drag order (null = use learned order)
  visitCount: number           // Derived from UserNavigationEvent aggregate
  learnedRank: number          // Computed rank (lower = more visited)
}

UserNavigationEvent {
  id: string
  userId: string
  tileId: string               // Maps to QuickAccessTile.tileId
  visitedAt: Date
}

UserQuickAccessConfig {
  userId: string
  tileId: string
  pinned: boolean
  hidden: boolean
  manualOrder: number | null
}
```

**UX Notes:**
- In learning mode (< 10 events), show the default role-filtered tile set in its default order with a subtle hint: *"Your Quick Access will personalise as you use the app."*
- In customise mode, tiles that are hidden show as greyed-out cards with a "Show" toggle — so users can see everything available to them, not just what's visible.
- Drag-and-drop should feel lightweight — consider the Angular CDK `DragDropModule`.

**Phase:** Phase 2 — depends on the `HomeComponent` static tile grid being stable (complete).
**Dependencies:** None beyond stable home page; no Phase 1 stories block this.

---

#### US-R5: Job Ad — Company Alumni Multi-Select from Companies Table (Phase 2)

**As a** recruiter creating or editing a job advertisement,  
**I want to** select preferred company alumni from a searchable list of known companies in the platform's companies table,  
**So that** the selection is consistent, avoids typos, and links to real company records.

**Acceptance Criteria:**
- The "Company Alumni" field in the Job Ad form is replaced with a searchable multi-select (PrimeNG `p-multiselect` or `p-autocomplete`) backed by a `GET /api/companies?search=<term>` endpoint.
- If a recruiter's desired company is not found, they can enter the company's **website URL** instead; the platform will enqueue a background job to look up / create a company record from that URL.
- Selected companies are stored as `company_id` references (not free-text strings) on the job advertisement.
- Existing free-text `companyAlumni` field on `JobAdvertisementCreateRequest` / `JobAdvertisementUpdateRequest` is deprecated and removed as part of this story.
- The backend enforces that at most 10 company alumni can be selected per advert.

**Backend changes required:**
- New endpoint: `GET /api/companies?search=<term>&size=20` — returns `id`, `name`, `logoUrl` for dropdown display.
- New join table: `job_advertisement_company_alumni (job_advertisement_id, company_id)` — replaces any free-text column.
- `JobAdvertisementDto` gains `companyAlumni: { id, name, logoUrl }[]`.

**Frontend changes required:**
- Replace the current free-text `companyInput` / chip pattern in `job-ad-form.component` with a PrimeNG `p-multiselect` or `p-autoComplete`.
- "Not found? Enter website URL" fallback triggers a modal or inline input that submits to a `POST /api/companies/from-url` endpoint.

**Phase:** Phase 2 — depends on US-R1 (job ad form stable) and the existing Companies table being queryable via API.

---

#### US-R6: Recruiter Views Applicants Who Have Shown Interest *(Phase 2)*

> **Story check:** this is the existing shortlist/reveal follow-through story for the Talent Search workflow. No separate "hook Talent Search into reveal/shortlist" story is required unless we explicitly expand the workflow beyond the applicant list + reveal handoff.

**As a** recruiter who has posted a job advertisement,
**I want to** see a list of candidates who have expressed interest in my job ad
**So that** I can review their Living CVs and decide whether to advance in the hiring process.

**Acceptance Criteria:**
- Recruiter can navigate to a job ad and see a list of candidates who have clicked "Show Interest" (status: APPLIED)
- Each applicant is shown under their alias — no real identity exposed
- Recruiter can open a candidate's Living CV (public, alias-safe view) directly from the applicants list
- The list shows: alias, class badge, date of interest, and a "View CV" action
- Recruiter can filter the list by class (All-Star / Gold / Silver / Bronze)
- Identity reveal from this screen follows the existing reveal workflow (US 1.8)
- Candidates who have withdrawn their interest are not shown

**Phase:** Phase 2 — depends on US-C1 (interest expression exists), US-R1 (job ad exists), US 1.3a (alias system)

---

**Strategic Flow:**
1. **Phase 1:** Build foundation (alias + basic privacy) + Global navigation (US-NAV1 — unblocks all roles from section silos)
2. **Phase 1.5:** Add trust layer (authenticity warnings, onboarding)
3. **Phase 2:** Implement monetization (reveal requests + subscription validation) + Talent Search (US-R4) + Dynamic Quick Access (US-H1)
4. **Phase 3:** Add compliance (audit logs, ToS enforcement)

---

#### US-NAV1: Global Hamburger Navigation Drawer *(Phase 1)*

**As a** user of the More platform (any role),
**I want** a globally accessible navigation drawer I can open from any page in the app,
**So that** I can jump directly to any section or sub-page without having to return to the home screen first.

**Problem it solves:**
Currently the only way to reach a section is via a Quick Access tile on the home screen. Once inside a section (e.g. `/jobs/opportunities`) there is no way to navigate to a different section (e.g. `/personal-development/living-cv`) without first going back to home. This makes the app feel like a collection of isolated silos rather than a coherent product.

---

**Acceptance Criteria:**

*Trigger & placement:*
- A hamburger icon (☰) sits at the far-left of the `TopbarComponent`, before the logo, on every authenticated page.
- Clicking it toggles the drawer open/closed. Clicking the overlay also closes it.
- The drawer is always hamburger-triggered — it never opens automatically or pins itself open on desktop.

*Drawer content — hierarchy per role (merged when user holds multiple roles):*
```
All roles
  └── Home                        →  /home

APPLICANT
  ├── Job Opportunities
  │     ├── Opportunities          →  /jobs/opportunities
  │     └── My Applications        →  /jobs/applications
  └── Personal Development
        ├── Living CV               →  /personal-development/living-cv
        ├── Goals                   →  /personal-development/goals
        ├── Work Experience         →  /personal-development/work-experience
        ├── Education               →  /personal-development/education
        ├── Certifications          →  /personal-development/certifications
        ├── Skills                  →  /personal-development/skills
        └── References              →  /personal-development/references

RECRUITER
  └── Recruitment
        ├── Job Ads                 →  /recruiter/job-ads
        └── Candidate Pool         →  /recruiter/candidates

MO_ADMIN
  └── Admin
        └── Outreach ML Export     →  /admin/outreach-ml
```
- If a user holds multiple roles, all permitted sections are merged into one ordered list (Home first, then role-grouped sections).
- Sections the user's roles do not permit are never rendered — no greyed-out items.

*Active state:*
- The section group header (e.g. "Job Opportunities") is highlighted when the current route is anywhere under its prefix.
- The specific child item (e.g. "My Applications") is highlighted when the current route matches exactly.
- Both highlights are visible simultaneously (parent accent + child solid highlight).

*Interaction with per-section sidebars:*
- The drawer is **additive** — the existing 80px per-section sidebars are not removed.
- When the drawer opens, the per-section sidebar on the current page hides for the duration the drawer is open, then restores when it closes. This prevents two simultaneous navigation panels competing for left-side space.

*Logout:*
- A "Logout" button appears at the bottom of the drawer.
- The existing logout in the home sidebar is **not removed** — both co-exist.

*Animations:*
- Drawer slides in from the left (`transform: translateX(-100%)` → `translateX(0)`).
- A semi-transparent overlay covers the rest of the page while the drawer is open.
- Transition: 250–300ms ease.

*Responsive:*
- Same toggle behaviour on all screen sizes — no persistent/pinned mode.

---

**Components to Create / Update:**

| Component / Service | Action | Location |
|---|---|---|
| `NavDrawerComponent` | Create | `shared/components/nav-drawer/nav-drawer.component.ts` |
| `NavDrawerService` | Create | `shared/services/nav-drawer.service.ts` |
| `TopbarComponent` | Update — add hamburger button | existing |
| `JobsLayoutComponent` | Update — hide sidebar when drawer open | existing |
| `InteractionsLayoutComponent` | Update — hide sidebar when drawer open | existing |
| `RecruiterLayoutComponent` | Update — hide sidebar when drawer open | existing |
| `RecruitmentLayoutComponent` | Update — hide sidebar when drawer open | existing |

`NavDrawerService` exposes: `toggle()`, `close()`, `isOpen: Signal<boolean>`.

`NavDrawerComponent` uses a static `NAV_SECTIONS: NavSection[]` constant (no API calls). Role filtering calls `AuthService.hasRole()`.



**No backend changes required.**

**Phase:** Phase 1 — usability gap; users cannot freely navigate without it.
**Dependencies:** `TopbarComponent` and `AuthService` (both stable).

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
