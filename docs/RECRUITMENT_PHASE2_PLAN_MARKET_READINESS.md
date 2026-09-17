# Recruitment App Extension - Phase 2 Plan & User Stories

> Phase 2 adds the Market Readiness Engine — a points-based scoring system that tiers candidates (Bronze → Platinum, with All-Star overlays), talent personas, candidate career pathways, recruiter watchlists, and knowledge assessments to signal engagement quality.

## Context

**Phase 2 Theme: Market Readiness Engine & Candidate Engagement**

Phase 3 introduces the **Market Readiness Engine** — a gamified, points-based scoring system that measures how fit a candidate is to be placed in the market. The existing Bronze/Silver/Gold tiers are carried forward and powered by this richer, weighted points engine. **Platinum** is added as the new top base tier (5,000+ points). **All-Star** ⭐ is not a base tier — it is a designation that can be earned at *any* base tier by achieving a strong Active Excellence score. A Gold All-Star is a Gold candidate who is actively upskilling and passing knowledge assessments. A Bronze All-Star is the most actively growing person in the entry tier. It rewards hustle and knowledge freshness independently of career depth.

Phase 2 also introduces **Talent Personas**, a **System-Guided Career Pathway**, the **Recruiter Watchlist** (stealth handshake), and the **Active Excellence Matrix** — a secondary performance index that differentiates candidates within the same tier.

**Prerequisites from Phase 1:**
- ✅ Alias system enforced server-side (US 1.3a)
- ✅ Living CV — goals, milestones, proof items, work experience, education, certifications, skills (US 1.1–1.3)
- ✅ Class calculation scheduler (US 1.4) — Phase 2 evolves this into the points engine
- ✅ Job Ads + Interest Expression (US-R1, US-C1) — Watchlist builds on candidate interest signals

**Stories pulled into Phase 2 (blockers):**
- ⬇️ **US 1.11** — Trust Messaging & Onboarding Tutorial
- ⬇️ **US 1.5** — Privacy & Visibility Controls
- ⬇️ **US-C3** — System Issues Vitality-Style Goal Challenges to Candidates

> **Note on US-P7 (Launch to Watchers):** The watchlist reveal is candidate-earned by completing their career pathway. It uses a lightweight time-limited token mechanism and is **not** gated on the Stripe payment flow. The full paid Identity Reveal (US 1.8) is a Phase 3 story.

---

## Market Readiness Tiers (Points Thresholds)

| Tier | Points Range |
|------|-------------|
| Bronze | 0 – 1,499 |
| Silver | 1,500 – 2,900 |
| Gold | 3,000 – 4,999 |
| Platinum | 5,000+ |
| **All-Star** ⭐ | Any base tier + Active Excellence score ≥ threshold (configured by admin) |

> **How to earn All-Star:** All-Star is **not** unlocked by accumulating Market Readiness points. It is earned by accumulating **Active Excellence points** — which come from completing system-issued challenges (US-C3), passing knowledge freshness assessments (US-P8), and completing custom goals. A candidate can be Bronze All-Star if they are actively hustling through challenges, or Platinum All-Star if they are both deeply experienced and actively growing. The base tier reflects *career depth and profile completeness*; the All-Star overlay reflects *active, ongoing growth behaviour*.

> **Migration note:** `Applicant.cachedClass` is extended with `marketReadinessScore: int`, `marketReadinessTier: MarketReadinessTier`, and `isAllStar: boolean`. The `CandidateClassScheduler` is evolved to compute the full points score, map it to the base tier, and then set `isAllStar = true` when the candidate's `activeExcellenceScore` meets the All-Star threshold — **regardless of which base tier they are in**. `ALL_STAR` is not a tier value; it is a flag that overlays the existing base tier badge. A candidate is always presented as e.g. "Gold ⭐" or "Bronze ⭐", never just "All-Star".

---

## Points Scoring Model

### 1. General Profile Completion

| Metric | Points |
|--------|--------|
| Full name, professional headline, location, verified email/phone | 100 |
| Professional headshot photo | 50 |
| Written professional summary / About Me | 50 |
| Salary expectation (value range or % increase target) | 100 |

### 2. Living CV — Career Depth

| Metric | Points |
|--------|--------|
| Big company (recognised employer) | 500 |
| Average tenure < 1 year | 50 |
| Average tenure 1–3 years | 300 |
| Average tenure 4–6 years | 600 |
| Average tenure 7–9 years | 1,000 |
| Average tenure 10+ years | 1,500 |

### 3. Certifications & Skills

| Metric | Points |
|--------|--------|
| Verified certification | 500 |
| Verified skill | 200 |
| Unverified skill | 20 |

### 4. Years of Experience

| Years | Points |
|-------|--------|
| 1–2 | 200 |
| 3–5 | 500 |
| 6–8 | 700 |
| 9–11 | 1,000 |
| 12–17 | 1,500 |
| 18+ | 2,000 |

---

## Active Excellence Matrix (Secondary Score — Path to All-Star)

> This is the **All-Star score**. Candidates accumulate Active Excellence points separately from their base Market Readiness Score. When `activeExcellenceScore >= allStarThreshold` (configured by admin), the candidate earns the All-Star ⭐ overlay on top of whatever base tier they are in. **A candidate at any tier can become All-Star purely by completing challenges and assessments — regardless of career depth.**

> The score does not affect tier thresholds (Bronze/Silver/Gold/Platinum). It serves as a "High-Performer Index" visible on candidate cards — recruiters use it to identify who is actively growing within a tier.

| Metric | Trigger Event | Active Excellence Points |
|--------|--------------|-------------------------|
| Knowledge Freshness | Pass an assessment on a new technology/framework version | +250 |
| Challenge Completion | Complete a system-issued vitality-style challenge (US-C3) | configurable per challenge |
| Custom Goal Completion | Complete a full candidate-created goal | configurable per template |

> **Challenge completions are the primary lever for All-Star.** The vitality-style challenge system (US-C3) is specifically designed to drive Active Excellence accumulation. Every streak challenge, certification challenge, and profile challenge completed moves the candidate closer to the All-Star threshold. Knowledge assessments (US-P8) are the other major driver.

**Knowledge Freshness** is the highest single-event award (+250 pts): the system generates assessments based on new technology releases (e.g. a new Java LTS version, a new AWS certification track) to test whether a candidate is keeping pace with the market.

---

## Talent Personas

Candidates self-select a persona that signals their intent to the system and to recruiters. The persona affects notification frequency, profile visibility defaults, and which features are surfaced.

| Persona | Description | System Behaviour |
|---------|-------------|-----------------|
| **Passive Prospect** | Currently employed and happy; open only to unicorn opportunities | Hidden profile; visible only to verified recruiters or matched companies; low-frequency, highly personalised notifications |
| **Warm Lead** | Preparing to leave; ready to interview in 1–3 months | "Open to Offers" toggle with adjustable timeline; skill-building notifications, salary trend alerts |
| **Active Job Seeker** | Aggressively looking now | Public profile searchable by all recruiters; "Available Immediately" badge; real-time alerts for new job postings |

---

## Phase 2 User Stories

### Epic: Market Readiness Engine

#### US-P1: System Calculates Market Readiness Score & Tier (Engine) ✅

**As a** system  
**I want to** compute a weighted Market Readiness Score for every candidate based on their profile completeness, career depth, certifications, and skills  
**So that** tiers (Bronze/Silver/Gold/Platinum) reflect true market fit rather than just activity level

**Acceptance Criteria:**
- Score is computed by summing all applicable points from the scoring model above
- Score and tier persisted on `Applicant` as `marketReadinessScore` and `marketReadinessTier`
- Recalculated weekly (extending the existing `CandidateClassScheduler`) and on demand when a profile section is updated (event-driven — trigger on goal/certification/experience save)
- `CandidateSearchResultDto` returns `marketReadinessTier` + `marketReadinessScore` in place of (or alongside) the old `candidateClass`
- `PublicLivingCvDto` returns the tier and score — no PII
- All existing `CandidateClassBadgeComponent` usages updated to display the new four tiers (Bronze/Silver/Gold/Platinum)

**Backend changes required:**
- `Applicant` entity: add `marketReadinessScore: int`, `marketReadinessTier: MarketReadinessTier` enum, `isAllStar: boolean`; deprecate `cachedClass`
- `MarketReadinessTier` enum: `BRONZE | SILVER | GOLD | PLATINUM` — `ALL_STAR` is not an enum value; it is derived from `activeExcellenceScore >= allStarThreshold` (independent of base tier)
- `MarketReadinessCalculator` service: pure scoring logic (sum all point buckets per candidate)
- `CandidateClassScheduler` extended to call `MarketReadinessCalculator` and persist result
- Event listener on `CandidateGoalUpdatedEvent`, `CertificationSavedEvent`, `WorkExperienceSavedEvent` → trigger partial recalculation
- Flyway migration: add columns to `applicants` table; new `MarketReadinessTier` enum type
- `CandidateSearchResultDto`, `PublicLivingCvDto`, `LivingCvDto` updated

**Frontend changes required:**
- `CandidateClassBadgeComponent` — update to handle `PLATINUM` tier + All-Star overlay (⭐ shown when `isAllStar = true` regardless of base tier badge); new colour palette
- All references to `CandidateClass` enum updated to `MarketReadinessTier`; `ALL_STAR` usages replaced with `isAllStar` flag check

**Phase:** Phase 2  
**Dependencies:** US 1.3 (Living CV data), US-C3 (challenge system — awards points into score engine), US 1.4 (scheduler infrastructure)

---

#### US-P2: Candidate Can View Their Market Readiness Score Breakdown ✅

**As a** candidate  
**I want to** see a detailed breakdown of my Market Readiness Score  
**So that** I understand exactly what is contributing to my tier and what I need to do to level up

**Acceptance Criteria:**
- Score breakdown page shows each scoring category (Profile, Career Depth, Certifications, Skills, Experience) with points earned vs maximum possible
- Progress bar toward next tier threshold
- Actionable "Next Steps" panel: top 3 actions that would gain the most points (e.g. "Add your salary expectation: +100 pts", "Upload your AWS Certification: +500 pts")
- Score updates in near real-time when candidate updates their profile (websocket or polling every 30s on this page)
- "Points History" section: recent events that triggered score changes (e.g. "Certification added — +500 pts")

**Components to Create:**
- `MarketReadinessScoreComponent` (`candidate/market-readiness/market-readiness-score/`) — tier badge, total score, progress bar to next tier
- `ScoreBreakdownComponent` (`candidate/market-readiness/score-breakdown/`) — per-category breakdown with earned vs max
- `NextStepsRecommendationComponent` (`candidate/market-readiness/next-steps/`) — top 3 actionable point gains
- `PointsHistoryComponent` (`candidate/market-readiness/points-history/`) — recent scoring events

**Backend changes required:**
- `GET /api/candidates/me/market-readiness` — full score breakdown by category + points history log
- `MarketReadinessBreakdownDto` — per-category earned/max, total, tier, nextTierThreshold, pointsHistory[]
- `MarketReadinessEvent` table — append-only log of scoring changes (category, delta, triggeredBy, createdAt)
- Flyway migration: `market_readiness_events` table

**Phase:** Phase 2
**Dependencies:** US-P1 (score exists)

---

#### US-P3: Candidate Selects Their Talent Persona

**As a** candidate  
**I want to** set my talent persona (Passive Prospect / Warm Lead / Active Job Seeker)  
**So that** the platform surfaces the right visibility, notifications, and features for my current situation

**Acceptance Criteria:**
- Persona selector shown during onboarding (after tutorial — US 1.11) and editable from Profile Settings
- "Warm Lead" persona shows an additional "Available in X months" slider (1–12 months)
- "Active Job Seeker" automatically enables the "Available Immediately" badge on candidate search results
- "Passive Prospect" sets profile visibility to `VERIFIED_RECRUITERS_ONLY` by default (can be overridden in privacy settings)
- Persona change is logged as an audit event
- Notification frequency is adjusted by persona (system-side — no UI control for this; it is automatic)

**Components to Create:**
- `PersonaSelectorComponent` (`candidate/settings/persona-selector/`) — card-based selector with persona descriptions; timeline slider for Warm Lead
- `AvailabilityBadgeComponent` (`shared/components/availability-badge/`) — "Available Immediately" / "Open to Offers" badge shown on candidate cards

**Components to Update:**
- `CandidateSearchResultDto` / `CandidateSearchComponent` — show `AvailabilityBadgeComponent` where persona is Active or Warm Lead
- `OnboardingTutorialComponent` — add persona selection as step 2

**Backend changes required:**
- `Applicant` entity: add `talentPersona: TalentPersona` enum, `availableInMonths: int` (nullable)
- `TalentPersona` enum: `PASSIVE_PROSPECT | WARM_LEAD | ACTIVE_JOB_SEEKER`
- `PATCH /api/candidates/me/persona` — update persona + availability timeline
- `CandidateSearchResultDto` — include `talentPersona` and `availableInMonths`
- Flyway migration

**Phase:** Phase 3  
**Dependencies:** US 1.5 (privacy controls), US 1.11 (onboarding tutorial)

---

### Epic: System-Guided Career Pathway

#### US-P4: Candidate Activates a Career Pathway

**As a** candidate  
**I want to** select a target role and receive a system-generated roadmap of skills, certifications, and experience I need  
**So that** I have a clear, structured path to becoming market-ready for that role

**Acceptance Criteria:**
- Candidate selects a target role (e.g. "Senior Software Engineer", "VP of Marketing") from a searchable list
- System generates a **career pathway** based on market data for that role:
  - Required skills
  - Common certifications
  - Expected portfolio pieces / proof types
  - Typical experience gaps vs candidate's current Living CV
- Candidate can customise the career pathway:
  - Check off items already completed (auto-detected where possible from Living CV)
  - Re-order steps by personal timeline
  - Add custom goals alongside system-generated steps
- Activating the career pathway awards **+50 pts**
- career pathway is visible on the candidate's Living CV (public — shows progress % to recruiters)
- Only one active career pathway at a time; previous career pathways archived

**Components to Create:**
- `PathwaySelectorComponent` (`candidate/career-pathway/career pathway-selector/`) — searchable role picker
- `PathwayRoadmapComponent` (`candidate/career-pathway/career pathway-roadmap/`) — ordered checklist, custom goal slots, progress bar
- `PathwayStepCardComponent` (`candidate/career-pathway/career pathway-step-card/`) — single step: title, type (skill/cert/project), status, proof upload

**Backend changes required:**
- New entity: `CareerPathway (id, targetRole, requiredSkills[], commonCertifications[], expectedProofTypes[], marketData)` — admin/system managed
- New entity: `CandidateCareerPathway (id, candidateId, CareerPathwayId, customSteps[], progressPercentage, activatedAt, completedAt, status)`
- `GET /api/career-pathways?role=<search>` — search available Career Pathways
- `POST /api/candidates/me/career-pathway` — activate a career pathway (awards +50 pts)
- `GET /api/candidates/me/career-pathway` — current active career pathway
- `PATCH /api/candidates/me/career-pathway/steps/{stepId}` — mark step complete / attach proof
- `GET /api/candidates/public/{alias}/living-cv` — include `pathwayProgress` (% complete, target role) in `PublicLivingCvDto`

**Phase:** Phase 2  
**Dependencies:** US-P1 (score engine), US-C3 (challenge system — challenge steps feed as career pathway step templates), US 1.3 (Living CV data for gap detection)

---

#### US-P5: career pathway Execution — Points for Milestone Completion

**As a** candidate working through my career pathway  
**I want to** earn points as I complete career pathway milestones  
**So that** my progress is rewarded and my Market Readiness Score reflects my active growth

**Point Triggers (career pathway Execution):**

| Action | Points |
|--------|--------|
| Upload a verified certification / course completion | +100 |
| Pass a system-backed anonymous skill assessment | +150 |
| Add a key project / portfolio piece to the career pathway | +70 |
| Maintain a 3-week career-building streak (log progress weekly) | +40 |

**Acceptance Criteria:**
- Points are awarded automatically when a career pathway step is marked complete with valid proof
- Skill assessment completion triggers +150 pts (assessment must be anonymous and system-backed — see US-P8)
- 3-week streak: system tracks weekly career pathway activity; awards +40 pts on the 3rd consecutive week; resets if a week is missed
- All point events are logged in `MarketReadinessEvent` table
- Score and tier recalculated immediately after each award

**Backend changes required:**
- `PathwayPointsAwardService` — evaluates proof type on step completion, dispatches correct point event
- Streak tracking: `CandidatePathwayStreak (candidateId, lastActivityWeek, currentStreakWeeks)` — updated on each career pathway activity
- Extend `MarketReadinessCalculator` to sum career pathway completion points

**Phase:** Phase 3  
**Dependencies:** US-P4 (career pathway exists), US-P1 (score engine)

---

### Epic: Recruiter Watchlist

#### US-P6: Recruiter Can Watch a Candidate (Stealth Handshake)

**As a** recruiter  
**I want to** add a candidate to my Watchlist when they are not yet ready but show strong potential  
**So that** I can build a warm talent pipeline and be notified when they become market-ready

**Core Value:**
- Solves the "silver medalist" problem — great candidates who need 1–2 more milestones don't get lost
- Candidate stays completely anonymous; recruiter only sees their alias and career pathway progress
- Recruiter can flag specific desired milestones (e.g. "AWS Certification highly desired")

**Watch Triggers (Recruiter Reasons to Watch):**
| Trigger | Description |
|---------|-------------|
| Skill Gap | Candidate lacks a specific cert/skill but has strong core |
| Experience Gap | Needs 1–2 more years or a leadership role |
| Timing Gap | Great candidate but no open budget right now |
| Domain Gap | Needs industry-specific experience |

**Acceptance Criteria:**
- "Watch Candidate" button appears on candidate cards in Talent Search and Candidate Pool (for recruiter role)
- Recruiter selects a watch reason from the trigger list above (required)
- Recruiter can flag up to 3 "Highly Desired" milestones on the candidate's career pathway
- Candidate receives a notification: *"A recruiter has added you to their Watchlist."* (no recruiter identity revealed)
- Candidate can **Accept** or **Decline** the watch request
  - If accepted: recruiter can see the candidate's career pathway progress bar — still no PII
  - If declined: recruiter is removed from the watchlist; candidate blocked from this recruiter's watch for 90 days
- Accepting a watch request awards the candidate **+40 pts**
- Completing a milestone flagged "Highly Desired" by a watching recruiter awards an additional **+50 pts**
- Watch expires after 6 months — recruiter receives a *"Check-in"* prompt at expiry

**Components to Create:**
- `WatchCandidateButtonComponent` (`recruiter/components/watch-candidate-button/`) — triggers watch request modal
- `WatchRequestModalComponent` (`recruiter/components/watch-request-modal/`) — trigger reason selector + milestone flag picker
- `WatchlistDashboardComponent` (`recruiter/watchlist/watchlist-dashboard/`) — list of watched candidates with progress bars, expiry dates, "Highly Desired" flag status
- `WatchRequestNotificationComponent` (`candidate/components/watch-request-notification/`) — candidate receives accept/decline prompt
- `WatchlistProgressCardComponent` (`recruiter/watchlist/watchlist-progress-card/`) — alias + tier + career pathway progress bar + desired milestone status

**Backend changes required:**
- New entity: `CandidateWatchRequest (id, recruiterId, candidateAlias, status, triggerReason, desiredMilestones[], createdAt, expiresAt, respondedAt)`
- New entity: `CandidateWatchlistEntry (id, recruiterId, candidateAlias, acceptedAt, expiresAt, desiredMilestones[])`
- `POST /api/recruiters/{id}/watchlist` — create watch request
- `GET /api/recruiters/{id}/watchlist` — recruiter's full watchlist with progress snapshots
- `PATCH /api/candidates/me/watch-requests/{requestId}` — accept or decline
- `GET /api/candidates/me/watch-requests` — pending watch requests for candidate
- `GET /api/recruiters/{id}/watchlist/{alias}/progress` — career pathway progress for a watched candidate (no PII)
- System job: expire watch entries after 6 months; send recruiter check-in notification
- Point award hooks: `WatchAcceptedEvent` → +40 pts; `HighlyDesiredMilestoneCompletedEvent` → +50 bonus pts

**Phase:** Phase 3  
**Dependencies:** US-P4 (career pathway progress visible), US 1.3a (alias system), US 1.8 (reveal workflow — "Launch to Watchers" uses this)

---

#### US-P7: Candidate Launches to Watchers (Stealth Reveal)

**As a** candidate who has completed their Career Pathway  
**I want to** trigger a targeted reveal to only the recruiters on my Watchlist  
**So that** I can surface myself to interested, pre-qualified recruiters at the moment I am ready

**Acceptance Criteria:**
- When a candidate hits 100% career pathway completion (or manually decides they are ready), a **"Launch to Watchers"** button appears on the Career Pathway Roadmap page
- Pressing it:
  1. Sends a high-priority notification to all accepted Watchlist recruiters: *"The talent you are watching is now Market Ready."*
  2. Temporarily lifts the alias veil **only for those specific recruiters** (partial reveal — name + contact unlocked for Watchlist recruiters without going through the standard Stripe reveal flow)
  3. Awards the candidate **+200 pts**
- Candidate can preview who is on their Watchlist before launching (recruiter company names shown, not individual names)
- Candidate can choose to exclude specific recruiters from the launch
- Points are awarded regardless of whether any recruiter responds

**Components to Create / Update:**
- `LaunchToWatchersButtonComponent` (`candidate/career-pathway/launch-to-watchers-button/`) — shown when career pathway ≥ 100%; preview watchlist before confirm
- `WatchlistPreviewModalComponent` (`candidate/career-pathway/watchlist-preview-modal/`) — list of watching companies (not individual recruiter names); exclude toggle per company
- Update `PathwayRoadmapComponent` — show Launch button when complete

**Backend changes required:**
- `POST /api/candidates/me/career-pathway/launch` — triggers notifications to watchlist, creates time-limited reveal tokens for each watching recruiter, awards +200 pts
- `WatchlistRevealToken (id, recruiterId, candidateId, issuedAt, expiresAt)` — time-limited (e.g. 72 hours); recruiter can access full `LivingCvDto` within window
- `GET /api/recruiters/{id}/watchlist/ready-candidates` — list of launched candidates the recruiter can now view
- Notification service: high-priority push + email for "Market Ready" event

**Phase:** Phase 3  
**Dependencies:** US-P6 (Watchlist exists), US-P4 (career pathway complete), US 1.8 (reveal infrastructure)

---

### Epic: Knowledge Freshness & Assessments

#### US-P8: System Generates Knowledge Freshness Assessments

**As a** candidate  
**I want to** take anonymous, system-generated assessments on new technology releases  
**So that** I can demonstrate I am keeping pace with the market and earn Active Excellence points

**Acceptance Criteria:**
- System generates assessments triggered by new technology releases (e.g. new Java LTS, new AWS certification track, new framework version)
- Assessments are **anonymous** — results are not linked to candidate identity externally; they are linked only to the candidate's Living CV internally
- Passing an assessment awards **+250 Active Excellence points** (secondary score, not main Market Readiness Score)
- Assessments are multiple-choice or short-answer; system-graded
- Candidate sees assessment history: topic, date taken, score, points awarded
- Assessments are accessible from a "Stay Current" section on the candidate dashboard
- Admin can create and publish new assessment topics (see Admin Epic)
- Each assessment has a validity window — after X months, a newer assessment on the same topic supersedes the points

**"Did You Know?" micro-questions:**
- In addition to full multi-question assessments, admin can author lightweight single-question **"Did You Know?"** cards
- These are fact-based awareness questions — not pass/fail assessments, but curiosity-spark moments (e.g. *"Did you know? Java 21 virtual threads reduce context-switch overhead by up to 95% vs platform threads. Which JEP introduced them? a) JEP 444 b) JEP 425 c) JEP 321"*)
- Answering correctly awards **+25 Active Excellence points** (small but stackable; wrong answers award 0 — no penalty)
- A new "Did You Know?" card surfaces on the candidate dashboard each week (or when triggered by a relevant technology event)
- Cards are dismissible but dismissed cards do not award points
- Admin marks a question as `type: DID_YOU_KNOW` vs `type: FULL_ASSESSMENT` when authoring — they appear in different UI sections
- "Did You Know?" cards can also be linked to challenge milestones as a lightweight knowledge pulse (completing the card counts as partial milestone progress)
- Candidate streak: answering 4 consecutive weekly "Did You Know?" cards correctly awards a **+100 bonus streak**

**Components to Create:**
- `AssessmentCentreComponent` (`candidate/assessments/assessment-centre/`) — list of available full assessments + "Did You Know?" card stack; "Stay Current" section
- `AssessmentRunnerComponent` (`candidate/assessments/assessment-runner/`) — multi-step question flow, anonymous submission
- `DidYouKnowCardComponent` (`candidate/assessments/did-you-know-card/`) — single-question flip card with fact reveal on answer; stackable in a carousel on the dashboard
- `AssessmentHistoryComponent` (`candidate/assessments/assessment-history/`) — completed assessments + answered DYK cards, scores, Active Excellence points earned

**Backend changes required:**
- New entity: `Assessment (id, topic, technology, version, type [FULL_ASSESSMENT | DID_YOU_KNOW], questions[], passMark, validityMonths, publishedAt, active)`
- New entity: `AssessmentQuestion (id, assessmentId, questionText, funFact, options[], correctAnswer, points)`  ← `funFact` field: the explanation revealed after answering a DYK card
- New entity: `CandidateAssessmentResult (id, candidateId, assessmentId, score, passed, takenAt, excellencePointsAwarded)`
- New entity: `CandidateDYKAnswer (id, candidateId, questionId, answeredCorrectly, answeredAt, pointsAwarded)` — tracks individual DYK card answers + streak calculation
- `GET /api/assessments/did-you-know/current` — this week's unanswered DYK card(s) for the candidate
- `POST /api/assessments/did-you-know/{questionId}/answer` — submit answer; response includes correct answer, funFact, points awarded, streak count
- `GET /api/assessments` — available assessments for candidate
- `POST /api/assessments/{assessmentId}/submit` — submit answers, get result + Active Excellence points
- `GET /api/candidates/me/assessments` — candidate's assessment history
- Active Excellence score updated on pass — stored as `activeExcellenceScore: int` on `Applicant`
- Admin endpoints (see Admin Epic below)

**Phase:** Phase 3  
**Dependencies:** US-P1 (Active Excellence score exists on Applicant)

---

### Epic: Admin — Market Readiness Tooling

#### US-P9: Admin Manages Career Pathways & Assessments

**As a** platform admin  
**I want to** create and manage Career Pathways and Knowledge Freshness Assessments  
**So that** the system-generated content stays current with market demands

**Acceptance Criteria (career pathways):**
- Admin can create a new `CareerPathway` with: target role name, required skills, common certifications, expected proof types, market data notes
- Admin can edit, deactivate, or archive career pathways
- Deactivated career pathways no longer appear in the selector but existing candidate career pathways remain active until completed

**Acceptance Criteria (Assessments):**
- Admin can create a new `Assessment` with: topic, technology, version, pass mark, validity months, questions (with correct answers)
- Admin can publish/unpublish an assessment
- Admin can view aggregate pass rates per assessment

**Components to Create (Admin feature):**
- `PathwayManagementComponent` (`admin/career-pathways/`) — CRUD for Career Pathways
- `AssessmentManagementComponent` (`admin/assessment-management/`) — CRUD for assessments + pass-rate analytics

**Backend changes required:**
- `GET /api/admin/career-pathways` — full list including inactive
- `POST /api/admin/career-pathways` — create Career Pathway
- `PATCH /api/admin/career-pathways/{id}` — edit / deactivate
- `GET /api/admin/assessments` — full list including unpublished
- `POST /api/admin/assessments` — create assessment
- `PATCH /api/admin/assessments/{id}` — publish / edit / deactivate
- `GET /api/admin/assessments/{id}/stats` — pass rate, submission count

**Phase:** Phase 3  
**Dependencies:** US-P4 (career pathway model), US-P8 (Assessment model)

---

#### US-P10: Candidate Can Verify a Skill via In-Platform Assessment

**As a** candidate  
**I want to** take a short, system-graded assessment when I add a new skill to my Living CV  
**So that** the skill is marked as verified, worth 200 pts in my Market Readiness Score instead of 20 pts, and recruiters can trust it is genuine

**Acceptance Criteria:**
- When a candidate adds a skill to their Living CV, an optional **"Verify this skill"** prompt is shown immediately after saving
- The candidate can dismiss the prompt and verify later from the Skills section (each unverified skill shows a **"Take Verification Test"** action)
- The verification test is a short, skill-specific assessment (5–10 questions, multiple-choice; sourced from the `Assessment` library with `type: SKILL_VERIFICATION`)
- On passing (`score >= passMark`): the skill's `verificationStatus` is set to `VERIFIED`, `verifiedAt` is recorded, and the Market Readiness Score is recalculated — the skill contributes 200 pts instead of 20 pts
- On failing: the skill remains `UNVERIFIED`; the candidate may retake after a configurable cooldown (default: 24 hours)
- A `SkillVerifiedEvent` is published → triggers a partial Market Readiness Score recalculation (same event-driven hook as `CertificationSavedEvent`)
- The Skills section of the Living CV displays a **✓ Verified** badge on verified skills; unverified skills show a faint **"Unverified"** label with the "Verify" CTA
- Assessment results are **not exposed externally** — recruiters see the ✓ badge only; the underlying score and pass mark are internal
- Admin can create and manage `SKILL_VERIFICATION` assessments per skill tag in the existing `AssessmentManagementComponent` (US-P9 admin scope extended)

**Components to Create:**
- `SkillVerificationPromptComponent` (`candidate/skills/skill-verification-prompt/`) — post-save inline prompt offering to start the verification test immediately
- `SkillVerificationBadgeComponent` (`shared/components/skill-verification-badge/`) — ✓ Verified / Unverified label shown on skill chips across the Living CV and candidate cards

**Components to Update:**
- `SkillsComponent` — show `SkillVerificationBadgeComponent` per skill; add "Take Verification Test" action on unverified skills
- `AssessmentRunnerComponent` (US-P8) — reuse for skill verification flow; pass `assessmentType: SKILL_VERIFICATION` and `skillId` as context
- `AssessmentManagementComponent` (US-P9) — extend to support `type: SKILL_VERIFICATION` with a `linkedSkillTag` field

**Backend changes required:**
- `CandidateSkill` entity: add `verificationStatus: SkillVerificationStatus` enum (`UNVERIFIED | VERIFIED`), `verifiedAt: Instant` (nullable), `verificationAssessmentId: Long` (nullable)
- `SkillVerificationStatus` enum: `UNVERIFIED | VERIFIED`
- `Assessment` entity: extend `type` enum to include `SKILL_VERIFICATION`; add `linkedSkillTag: String` (nullable) — maps an assessment to a specific skill
- `GET /api/assessments/skill-verification?skill={skillTag}` — fetch the active verification assessment for a given skill (returns 404 if none published yet; skill remains perpetually unverifiable until admin authors one)
- `POST /api/assessments/{assessmentId}/submit` — existing endpoint; when `type = SKILL_VERIFICATION` and result is pass, sets `verificationStatus = VERIFIED` on the candidate's matching `CandidateSkill` and publishes `SkillVerifiedEvent`
- `SkillVerifiedEvent` → `MarketReadinessCalculator` partial recalculation (re-scores the Skills category only)
- Cooldown enforcement: `CandidateSkillVerificationAttempt (id, candidateId, skillId, attemptedAt, passed)` — checked before allowing a retake
- Flyway migration: add `verification_status`, `verified_at`, `verification_assessment_id` to `candidate_skills`; new `candidate_skill_verification_attempts` table

**Phase:** Phase 3  
**Dependencies:** US-P1 (score engine — SkillVerifiedEvent triggers recalculation), US-P8 (Assessment entity and AssessmentRunner reused), US-P9 (admin assessment management extended)

---

#### US-P11: Candidate Can See Their Peer Ranking Within Their Tier

**As a** candidate  
**I want to** see where I stand relative to other candidates in my tier  
**So that** I understand how competitive my profile is and am motivated to improve

> **Privacy note:** Ranking is shown as an **anonymous percentile** only (e.g. *"You are in the top 18% of Silver candidates"*). No other candidate's identity, alias, or score is ever exposed. This is a self-service signal, not a leaderboard. The admin leaderboard (US-009 in Admin Phase 1) is a separate, admin-only view.

**Acceptance Criteria:**
- Candidate sees their **percentile rank within their current base tier** (e.g. "Top 18% of Silver candidates") on their Market Readiness Score page (US-P2)
- A secondary percentile is shown for **Active Excellence score within their tier** (e.g. "Top 5% of Silver candidates by active growth") — highlights All-Star proximity
- Percentile is calculated as: `(candidates in same tier with lower score / total candidates in same tier) * 100`, rounded to the nearest whole number
- Shown as a motivational label, not a raw number: e.g. *"Top 18%"*, *"Top 50%"*, *"Bottom 25%"* — the exact phrasing is configurable per tier by admin
- A contextual nudge is shown when the candidate is close to moving tier (e.g. *"You need 340 more points to reach Gold — only 8% of Silver candidates are this close"*)
- Percentile is recalculated on the same schedule as the Market Readiness Score (weekly batch + on-demand after profile updates)
- Percentile is **not** shown on the public Living CV or to recruiters — it is a private, candidate-only signal

**Components to Update:**
- `MarketReadinessScoreComponent` (US-P2) — add percentile pill below the tier badge (e.g. "Top 18% of Silver")
- `ScoreBreakdownComponent` (US-P2) — add a "Your Standing" row showing base tier percentile + Active Excellence percentile side by side
- `NextStepsRecommendationComponent` (US-P2) — contextual nudge when candidate is in top 10% of their tier (close to next threshold)

**Backend changes required:**
- `GET /api/candidates/me/market-readiness` — extend `MarketReadinessBreakdownDto` with `tierPercentile: int` and `activeExcellencePercentile: int`
- `CandidateRankingService` — computes percentile for a given candidate against all candidates in the same `marketReadinessTier`; runs as part of the weekly `CandidateClassScheduler` pass and on-demand via `MarketReadinessRecalculatedEvent`
- Percentiles cached on `Applicant` as `tierPercentile: int` and `activeExcellencePercentile: int` (updated alongside score)
- Flyway migration: add `tier_percentile`, `active_excellence_percentile` columns to `applicants`

**Phase:** Phase 3  
**Dependencies:** US-P1 (score and tier exist), US-P2 (score breakdown page exists to surface the percentile)

---

## Story Breakdown Summary — Phase 3

| Story | Focus | Sprint | Dependencies | Estimated Effort |
|-------|-------|--------|--------------|-----------------|
| **US 1.11** | Trust messaging & onboarding tutorial | 6 | US 1.3a, US 1.2 | 0.5 sprint |
| **US 1.5** | Privacy / visibility toggles | 6 | US 1.3, US 1.2, US 1.3a | 1 sprint |
| **US-C3** | System Issues Vitality-Style Goal Challenges to Candidates | 7 | US 1.3, US 1.4, US-C2 | 1.5 sprints | ✅
| **US-P1** | Market Readiness Score & Tier engine | 8 | US 1.4, US-C3 | 2 sprints | ✅
| **US-P2** | Candidate score breakdown + next steps | 8 | US-P1 | 1 sprint | ✅
| **US-P3** | Talent Personas (Passive/Warm/Active) | 9 | US 1.5, US 1.11 | 1 sprint |
| **US-P4** | System-Guided Career Pathway activation | 10 | US-P1, US-C3 | 2 sprints |
| **US-P5** | career pathway execution points + streak | 10 | US-P4, US-P1 | 0.5 sprint |
| **US-P6** | Recruiter Watchlist (stealth handshake) | 11 | US-P4, US 1.3a | 2 sprints |
| **US-P7** | Launch to Watchers (watchlist token reveal) | 11 | US-P6, US-P4 | 1 sprint |
| **US-P8** | Knowledge Freshness Assessments | 12 | US-P1 | 2 sprints |
| **US-P9** | Admin: career pathway & Assessment management | 12 | US-P4, US-P8 | 1 sprint |
| **US-P10** | Candidate skill verification via in-platform test | 12 | US-P1, US-P8, US-P9 | 1 sprint |
| **US-P11** | Candidate peer percentile ranking within tier | 12 | US-P1, US-P2 | 0.5 sprint |

---

## New Backend Entities Summary (Phase 3)

| Entity | Story | Key Fields |
|--------|-------|-----------|
| `MarketReadinessEvent` | US-P1/P2 | candidateId, category, delta, triggeredBy, createdAt |
| `CareerPathway` | US-P4 | id, targetRole, requiredSkills[], commonCertifications[], expectedProofTypes[] |
| `CandidateCareerPathway` | US-P4 | id, candidateId, CareerPathwayId, customSteps[], progressPercentage, status |
| `CandidatePathwayStreak` | US-P5 | candidateId, lastActivityWeek, currentStreakWeeks |
| `CandidateWatchRequest` | US-P6 | recruiterId, candidateAlias, status, triggerReason, desiredMilestones[], expiresAt |
| `CandidateWatchlistEntry` | US-P6 | recruiterId, candidateAlias, acceptedAt, expiresAt, desiredMilestones[] |
| `WatchlistRevealToken` | US-P7 | recruiterId, candidateId, issuedAt, expiresAt |
| `Assessment` | US-P8 | topic, technology, version, questions[], passMark, validityMonths |
| `AssessmentQuestion` | US-P8 | assessmentId, questionText, options[], correctAnswer, points |
| `CandidateAssessmentResult` | US-P8 | candidateId, assessmentId, score, passed, takenAt, excellencePointsAwarded |
| `CandidateSkillVerificationAttempt` | US-P10 | candidateId, skillId, attemptedAt, passed |

---

## New Flyway Migrations (Phase 3)

| Migration | Description |
|-----------|-------------|
| `V18__Market_Readiness_Score.sql` | Add `market_readiness_score`, `market_readiness_tier`, `is_all_star`, `active_excellence_score`, `talent_persona`, `available_in_months` to `applicants` |
| `V19__Market_Readiness_Events.sql` | `market_readiness_events` table |
| `V20__Career_Pathways.sql` | `career_pathways`, `candidate_career_pathways`, `candidate_pathway_steps` tables |
| `V21__Pathway_Streak.sql` | `candidate_pathway_streaks` table |
| `V22__Watchlist.sql` | `candidate_watch_requests`, `candidate_watchlist_entries`, `watchlist_reveal_tokens` tables |
| `V23__Assessments.sql` | `assessments`, `assessment_questions`, `candidate_assessment_results` tables |
| `V24__Skill_Verification.sql` | Add `verification_status`, `verified_at`, `verification_assessment_id` to `candidate_skills`; new `candidate_skill_verification_attempts` table |
| `V25__Tier_Percentile.sql` | Add `tier_percentile`, `active_excellence_percentile` columns to `applicants` |
