# Recruitment App Extension — Phase 4 Plan: Ideal Team Builder

> Phase 4 introduces the **Ideal Team Builder** — a squad composition engine that lets hiring managers define precise headcount and per-slot criteria, search the candidate pool per slot, and receive AI-assisted "Ideal Squad" suggestions that surface hidden talent combinations the manager's own filters would have missed.

---

## Context

**Phase 4 Theme: Employer-Side Demand Intelligence**

Every phase up to this point has been supply-side — building and surfacing candidate quality. Phase 4 introduces a structured demand-side workflow: an employer or hiring manager arrives with a precise squad requirement (e.g. "I need a 14-person Software Product Delivery team") and the platform both fulfils the search *and* augments it with a recommendation engine that finds team chemistry, domain overlap, and shared delivery history that raw filter queries can never surface.

This phase also activates the dormant `EMPLOYER` and `HIRING_MANAGER` account types as first-class platform participants.

**Prerequisites:**
- ✅ Market Readiness tiers + Active Excellence scores (Phase 2)
- ✅ Talent Search across all tiers (US-R4 — Phase 3)
- ✅ Alias + zero-PII Living CV (US 1.3a — Phase 1)
- ✅ Career Pathway progress visible on public Living CV (US-P4 — Phase 2)
- ✅ Company Alumni registry (US-R5 — Phase 3)
- ✅ Identity Reveal infrastructure (US 1.8 — Monetization Phase 1)

---

## The Feature in One Sentence

A hiring manager defines a multi-slot squad brief; the platform runs per-slot candidate matching and simultaneously shows a sidebar "Ideal Squad" recommendation that surfaces close-match candidates, domain specialists, and shared-history clusters the strict filters would have missed.

---

## Implementation Order

| Sprint | Stories | Rationale |
|--------|---------|-----------|
| **Sprint 16** | US-TB1 (Team Brief authoring), US-TB2 (Per-slot candidate search) | Core data model + filter engine |
| **Sprint 17** | US-TB3 (Ideal Squad recommendation engine), US-TB4 (Drag-and-drop roster assembly) | AI recommendation sidebar |
| **Sprint 18** | US-TB5 (Draft Roster output — PDF, share, bulk invite), US-TB6 (Candidate interest in a slot) | Output actions + candidate-side |
| **Sprint 19** | US-A27 (Admin: Team Template Library), US-TB7 (Synergy cluster detection), polish | Admin tooling + synergy engine |

---

## Phase 4 Stories

---

### Epic: Team Brief

#### US-TB1: Hiring Manager Builds a Team Brief

**As a** hiring manager  
**I want to** define a multi-slot squad brief by specifying role types, headcount per role, and per-slot filter criteria  
**So that** the platform knows exactly what composition I am trying to assemble and can run targeted matching against each slot

**Acceptance Criteria:**

*Brief creation:*
- Hiring manager creates a named **Team Brief**: brief title (e.g. "Q4 Software Product Delivery Pod"), target delivery start date, optional description
- Brief is linked to a **Team Template** if one was selected (see US-A27) — slots are pre-populated from the template and then customisable
- Status: `DRAFT` / `ACTIVE` / `FILLED` / `CLOSED`

*Slot definition (per role in the team):*
- Manager adds one or more **Slots** to the brief, each with:
  - `roleTitle` (free text, e.g. "Senior Backend Developer")
  - `headcount` (integer — number of people needed for this role, e.g. 4)
  - `skills[]` (required skills — multi-tag input)
  - `minExperienceYears` / `maxExperienceYears` (optional range)
  - `preferredTier` (`BRONZE` / `SILVER` / `GOLD` / `PLATINUM` — minimum acceptable tier)
  - `domain` (optional domain preference, e.g. `FINTECH`, `HEALTH`, `AUTOMOTIVE`)
  - `certifications[]` (optional required certifications)
  - `notes` (free text — e.g. "Must have led at least one greenfield project")
- Total headcount is shown as a running tally: "14 / 14 slots defined"

*Example brief (the canonical reference for this phase):*

| Slot | Headcount | Key filters |
|------|-----------|-------------|
| Junior Developer | 2 | React, Node.js, < 2 years experience |
| Senior Developer | 4 | AWS, Kubernetes, Python, 6+ years experience |
| QA Tester | 5 | Selenium, Automation, QA processes |
| Business Analyst | 2 | Agile, FinTech domain experience |
| Scrum Master | 1 | CSM certification, Jira |

**Components to Create:**
- `TeamBriefBuilderComponent` (`employer/team-brief/builder/`) — brief metadata form + slot list builder
- `SlotEditorCardComponent` (`employer/team-brief/slot-editor-card/`) — per-slot form: role title, headcount, skill tags, experience range, tier floor, domain, certs, notes
- `BriefHeadcountSummaryComponent` (`employer/team-brief/headcount-summary/`) — running tally of slots and total headcount

**Backend:**
- New entity: `TeamBrief (id, employerId, title, description, targetStartDate, status, teamTemplateId?, createdAt)`
- New entity: `TeamBriefSlot (id, briefId, roleTitle, headcount, skills[], minExperienceYears, maxExperienceYears, preferredTier, domain, certifications[], notes, sortOrder)`
- `POST /api/team-briefs` — create brief
- `PUT /api/team-briefs/{id}` — update brief + replace slots
- `GET /api/team-briefs` — list briefs for the logged-in employer
- `GET /api/team-briefs/{id}` — brief detail with slots

**Phase dependency:** Phase 4 (this phase)

---

#### US-TB2: Platform Runs Per-Slot Candidate Search

**As a** hiring manager reviewing my Team Brief  
**I want to** see a ranked candidate list for each slot — filtered strictly to my criteria  
**So that** I have a concrete starting shortlist to work from for every role

**Acceptance Criteria:**

*The slot-by-slot results view:*
- Main interface shows the brief's slots as a vertical or tabbed bucket list: "Junior Developer (0/2 filled) | Senior Developer (0/4 filled) | ..."
- Selecting a slot shows a ranked candidate list: alias, tier, Market Readiness score, Active Excellence score, years experience, matched skills, career pathway progress % (if active), All-Star flag
- Candidates are ranked by: tier floor met → skill match count → Market Readiness score descending
- Strict filter: only candidates matching **all** specified skills AND experience range AND tier floor appear in the standard results list
- Manager can adjust filters inline (per slot) without re-opening the brief builder — changes immediately re-query
- Candidate count per slot is displayed: "14 candidates match your filters for this slot"

*Pagination and profile preview:*
- Results are paginated (20 per page)
- Clicking a candidate opens a **Slot Profile Preview** side-panel: alias, tier, skills, experience summary, career pathway progress, Active Excellence score — no PII at this stage
- Preview panel has a "Save to Slot" button — places the candidate into that slot's shortlist

*Filled vs unfilled slot indicators:*
- Slot tabs show a fill progress bar: "2/4 shortlisted"
- A slot is `SHORTLISTED_FULL` when the shortlisted count equals the headcount
- A slot is `FILLED` when all candidates in the slot have accepted an interview invite

**Components to Create:**
- `TeamBriefWorkspaceComponent` (`employer/team-brief/workspace/`) — the main post-brief-creation workspace; slot tabs + results panel + roster sidebar
- `SlotResultsListComponent` (`employer/team-brief/slot-results/`) — ranked candidate list for the active slot; inline filter adjustment bar
- `SlotCandidatePreviewPanelComponent` (`employer/team-brief/candidate-preview/`) — side panel: alias, scores, skills, career pathway progress, Save to Slot button
- `SlotFillProgressBarComponent` (`employer/team-brief/slot-fill-progress/`) — n/headcount filled indicator per slot tab

**Backend:**
- `POST /api/team-briefs/{id}/slots/{slotId}/search` — run filtered candidate search for a slot; body: `{ page, size, overrides? }` (overrides allow inline filter adjustments); returns ranked `SlotCandidateResultDto[]`
- `POST /api/team-briefs/{id}/slots/{slotId}/shortlist` — add candidate to slot shortlist: `{ candidateAlias }`
- `DELETE /api/team-briefs/{id}/slots/{slotId}/shortlist/{alias}` — remove from shortlist
- `GET /api/team-briefs/{id}/roster` — current shortlist state across all slots

**Phase dependency:** Phase 4 (US-TB1)

---

### Epic: Ideal Squad Recommendation Engine

#### US-TB3: Platform Surfaces "Ideal Squad" AI Sidebar Recommendations + Team Composition Health

**As a** hiring manager filling my Team Brief  
**I want** the platform to show me an alternative "Ideal Squad" suggestion sidebar that surfaces candidates my strict filters would have missed, and a live Team Composition Health panel that evaluates my assembled roster as a whole  
**So that** I can discover higher-fit talent through a combination of close-match relaxation, domain expertise, and team synergy signals — and understand whether the team I'm building will actually work well together

**Acceptance Criteria:**

*The sidebar panel:*
- A persistent **"Ideal Squad" sidebar** is visible on the Team Brief Workspace
- The sidebar displays a system-curated roster suggestion — one recommended candidate per slot (or per headcount unit for multi-seat slots)
- Each recommendation card shows: alias, tier, why-recommended justification (see below), a match confidence indicator (High / Medium), and a "Add to Slot" button
- The sidebar can be collapsed to give more space to the manual results view

---

*Part A — Per-candidate recommendation signals*

The engine generates one or more of these signals per candidate. All are deterministic rules (no ML required to launch):

**1. Close Match, High Fit (Filter Relaxation)**
- Candidate misses exactly one filter criterion by a small margin (e.g. 2.5 years vs. < 2 years filter, or 5.5 years vs. 6+ years filter)
- But their Market Readiness score, Active Excellence score, or verified proof quality significantly exceeds the average for candidates who do pass the filter
- Platform justification label: *"Missed your filter by 6 months, but their technical execution matches your Senior requirements at a Junior tier"*
- Trigger condition: `missedFilterCount == 1 AND candidateScore >= p75OfStrictMatches`

**2. Domain Expert Override (Specialist Signal)**
- Candidate is missing a specific tool from the filter (e.g. no Selenium) but has deep verified domain experience in the exact domain the team is targeting (e.g. FinTech payments testing)
- Domain experience is sourced from: Living CV `domain` tag, verified work history entries, and career pathway progress in domain-specific steps
- Platform justification label: *"Does not use Selenium, but has 4 years of domain-specific payments testing experience — significantly reducing onboarding time"*
- Trigger condition: `missingSkill IN nonCoreTools AND candidateDomainExperience >= 3 years AND domain == slotDomain`

**3. Synergy Cluster (Shared Delivery History)**
- The system detects that two or more candidates across different slots have a verified shared work history (same `companyAlumni` entry within the same date range)
- These candidates are surfaced as a **cluster recommendation** — all highlighted simultaneously with a shared justification
- Platform justification label: *"These 3 candidates delivered 12 sprints together at [Company X] — adding them as a cluster ensures instant team velocity from day one"*
- The cluster badge is shown on all affected recommendation cards simultaneously
- Trigger condition: `sharedCompany EXISTS AND dateRangeOverlap >= 6 months AND candidatesSpanAtLeast2DifferentSlots`

**4. Career Pathway Alignment (Growth Signal)**
- Candidate is currently on a Career Pathway directly aligned with the slot's role title (e.g. actively pursuing "Tech Lead" pathway while applying for a Senior Developer slot)
- Platform justification label: *"Actively following the [Tech Lead] career pathway — 73% complete. High alignment with your Senior Developer requirements and long-term growth potential"*
- Trigger condition: `activePathway.targetRole ~= slotRoleTitle AND pathwayProgress >= 50%`

**5. All-Star Premium Flag**
- Any All-Star candidate (regardless of whether they strictly pass filters) is surfaced in the sidebar with a ⭐ premium indicator
- Justification: *"All-Star designation — consistently in the top active-growth percentile on the platform"*

---

*Part B — Team Composition Health Score (roster-level analysis)*

Once 50%+ of slots are shortlisted, a **Team Composition Health** panel appears below the Ideal Squad sidebar. This evaluates the assembled roster *as a whole* across five dimensions — signals that are meaningless at the individual level but critical at the team level.

Each dimension shows a score (`🟢 Strong` / `🟡 Watch` / `🔴 Risk`) and a one-line justification.

**Dimension 1: Domain Cohesion**
- Measures how much shared domain context the assembled roster has
- Strong: the majority of shortlisted candidates share the same primary domain (e.g. FinTech) — team speaks the same business language from day one
- Risk: domain spread is wide with no dominant context — high onboarding and communication overhead
- Source: `domain` tags on Living CVs + verified work history
- Example: *"9 of 14 candidates share FinTech domain experience — strong shared business context"*

**Dimension 2: Stack Coherence (Technology Split Risk)**
- Detects technology stack splits across the same role type
- Example risk: 4 Senior Devs are AWS-certified, 1 is Azure-only — invisible friction in cloud tooling, IAM policies, deployment pipelines
- Example strength: all 5 testers hold ISTQB — unified QA methodology from sprint 1
- Source: `skills[]` on Living CV + certifications + `CandidateAssessmentResult` data
- Justification label: *"Mixed cloud stack detected across Senior Dev slots (AWS × 4, Azure × 1) — consider aligning or scoping responsibilities"*

**Dimension 3: Knowledge Freshness Alignment**
- Evaluates whether candidates' verified knowledge is current on the team's primary technology stack
- Surfaces candidates with stale or absent assessment results on the key skills specified in the brief's slot filters
- Justification label: *"2 of your shortlisted Senior Devs have no recent assessments on your primary stack (Python, AWS) — factor in ramp-up time"*
- Source: `CandidateAssessmentResult` records linked to skills matching the slot's `skills[]` filter
- Does not block shortlisting — this is advisory information, not a gate

**Dimension 4: Delivery Culture Fit**
- Detects cultural and methodology alignment signals across the assembled team using deterministic Living CV attributes:
  - `AGILE_ALIGNMENT`: does the roster have consistent Agile/Scrum methodology signals? (CSM certs, sprint delivery tags, Jira experience)
  - `COMPANY_SIZE_TRAJECTORY`: are candidates predominantly startup-background, enterprise-background, or mixed? Mixed without a dominant type signals potential culture-of-work friction
  - `TENURE_STABILITY`: a roster where most candidates have average tenure < 18 months is a retention risk flag
- Justification label examples:
  - *"Strong Agile alignment across all slots — unified delivery methodology"*
  - *"Mixed company size backgrounds (startup × 6, enterprise × 8) — onboarding to your delivery culture may need active management"*
  - *"3 candidates show short average tenure (< 18 months) — flag for retention discussion"*

**Dimension 5: Seniority Balance**
- Evaluates whether the seniority spread across the assembled roster matches the brief's headcount intent
- Flags imbalances: too junior-heavy (high mentoring overhead), too senior-heavy (cost risk, under-utilisation of senior time on routine work), no mid-level bridge
- Justification label: *"2 juniors / 4 seniors / 0 mid-level — consider adding a mid-level buffer to reduce senior mentoring load"*
- Source: `yearsExperience` on Living CV + tier

*Health panel behaviour:*
- Panel updates in real time as candidates are added to or removed from the roster
- Each dimension is expandable — clicking it shows the per-candidate breakdown behind the score
- Manager can dismiss individual warnings (logged as acknowledged, not acted on)
- Health panel is included in the PDF roster export as an advisory summary

---

*Sidebar behaviour (both parts):*
- Recommendations refresh automatically when the manager adjusts slot filters or adds candidates to the roster
- Manager can thumbs-down a recommendation to remove it and generate the next-best alternative
- Manager can thumbs-up to pin the recommendation to the top of the sidebar
- Recommendation state (thumbs up/down, pinned) persists for the lifetime of the Team Brief

**Components to Create:**
- `IdealSquadSidebarComponent` (`employer/team-brief/ideal-squad-sidebar/`) — collapsible panel; slot-grouped recommendation cards + composition health panel below
- `RecommendationCardComponent` (`employer/team-brief/recommendation-card/`) — alias, tier badge, confidence chip, justification label, cluster badge, Add to Slot / thumbs up/down actions
- `SynergyClusterBadgeComponent` (`employer/team-brief/synergy-cluster-badge/`) — shared across all cards in a cluster; shows company name and overlap duration
- `TeamCompositionHealthPanelComponent` (`employer/team-brief/composition-health/`) — five dimension rows; each row: icon, label, score chip, one-line justification, expandable detail
- `CompositionDimensionDetailComponent` (`employer/team-brief/composition-health/dimension-detail/`) — per-candidate breakdown for a given dimension; dismiss warning action

**Backend:**
- `GET /api/team-briefs/{id}/recommendations` — generate full Ideal Squad recommendation set; returns `IdealSquadRecommendationDto` with per-slot recommendations + detected synergy clusters
- `GET /api/team-briefs/{id}/composition-health` — evaluate the current roster and return `TeamCompositionHealthDto` with scores and justifications for all five dimensions; recalculated on each roster change
- `POST /api/team-briefs/{id}/recommendations/{alias}/feedback` — record thumbs-up / thumbs-down; body: `{ signal: 'UP' | 'DOWN', slotId }`
- `POST /api/team-briefs/{id}/composition-health/dismiss` — acknowledge a dimension warning; body: `{ dimension, reason? }`
- `RecommendationEngineService` — orchestrates per-candidate signals:
  1. Loads strict match results per slot
  2. Runs close-match relaxation pass
  3. Runs domain expert pass
  4. Runs synergy cluster detection (cross-slot `company_alumni` overlap query)
  5. Runs career pathway alignment pass
  6. Runs All-Star flagging pass
  7. Deduplicates and ranks
- `TeamCompositionHealthService` — orchestrates roster-level signals:
  1. Domain cohesion: aggregate `domain` tags across shortlisted candidates; compute dominant domain % 
  2. Stack coherence: group `skills[]` by slot type; detect splits within same-role slots
  3. Knowledge freshness: join `CandidateAssessmentResult` against slot `skills[]`; flag stale or absent results
  4. Delivery culture fit: evaluate Agile signals, company size distribution, tenure stability
  5. Seniority balance: bin candidates by `yearsExperience`; evaluate spread against brief headcount intent

**New entities:**
- `BriefRecommendationFeedback (id, briefId, slotId, candidateAlias, signal [UP|DOWN], recordedAt)`
- `BriefCompositionHealthDismissal (id, briefId, dimension, acknowledgedAt, reason?)`

**Phase dependency:** Phase 4 (US-TB2)

---

#### US-TB4: Hiring Manager Assembles the Draft Roster by Drag-and-Drop

**As a** hiring manager  
**I want to** drag candidates from either the filtered results list or the Ideal Squad sidebar into my slot buckets  
**So that** I can build a draft roster using whichever mix of manual picks and platform suggestions feels right

**Acceptance Criteria:**
- Candidates from the standard results list can be dragged onto a slot bucket to shortlist them
- Candidates from the Ideal Squad sidebar can be dragged onto their suggested slot (or a different slot) — adding from sidebar also records a "suggestion accepted" signal
- Drag handles are visible on both result rows and recommendation cards
- Dropping a candidate onto an already-full slot (headcount met) shows a confirmation: "This slot is full. Replace [current candidate] or increase headcount?"
- Roster sidebar (right panel) shows current shortlisted candidates per slot at all times; candidates can be removed by drag-out or a remove button
- Roster fill progress (e.g. "9 / 14 slots filled") is shown in the workspace header at all times

**Components:**
- Extend `TeamBriefWorkspaceComponent` with CDK drag-and-drop zones
- `RosterPanelComponent` (`employer/team-brief/roster-panel/`) — always-visible right panel; per-slot candidate chips with remove action; overall fill count

**Phase dependency:** Phase 4 (US-TB2, US-TB3)

---

### Epic: Draft Roster Output

#### US-TB5: Hiring Manager Exports or Acts on the Finalised Draft Roster

**As a** hiring manager  
**I want to** export the draft roster or trigger bulk actions once I have filled all my slots  
**So that** I can hand off to HR or immediately start the interview process

**Acceptance Criteria:**

*Export options (no identity reveal required):*
- **Download as PDF** — generates a branded roster PDF: brief title, target start date, per-slot table (role, headcount, candidate aliases, tier, key matched skills). No PII — aliases only until reveal
- **Share with HR** — generates a share link (time-limited, 72 hours) that renders the roster as a read-only web page. HR recipients do not need a platform account

*Bulk interview invite:*
- "Send Interview Invites to All 14 Candidates" button — triggers the existing identity reveal + outreach flow for all shortlisted candidates simultaneously
- A confirmation dialog shows: total cost (X reveals at Y credits each), list of slots and aliases
- On confirm: for each shortlisted candidate, creates a `WatchlistEntry` (if not already watching), then immediately sends the interview invite notification via the existing reveal mechanism (US 1.8)
- Manager sees a per-candidate status update: "Invite sent" / "Already contacted" / "Declined reveal"

*Roster lock:*
- Once "Send Interview Invites" is confirmed, the brief status transitions to `ACTIVE` — slots can still be adjusted but the roster is versioned (a snapshot is saved)
- Brief transitions to `FILLED` when all invites have been accepted

**Components to Create:**
- `RosterExportButtonsComponent` (`employer/team-brief/roster-export/`) — PDF download, share link generation, bulk invite CTA
- `BulkInviteConfirmationDialogComponent` (`employer/team-brief/bulk-invite-dialog/`) — cost summary, per-candidate list, confirm/cancel

**Backend:**
- `GET /api/team-briefs/{id}/roster/pdf` — generate and return PDF roster (alias-only)
- `POST /api/team-briefs/{id}/roster/share` — create time-limited share token; returns share URL
- `POST /api/team-briefs/{id}/roster/invite-all` — bulk reveal + invite trigger for all shortlisted candidates; returns per-candidate result list

**Phase dependency:** Phase 4 (US-TB4), Monetization Phase 1 (US 1.8)

---

### Epic: Candidate-Side Slot Interest

#### US-TB6: Candidate Expresses Interest in a Team Brief Slot

**As a** candidate  
**I want to** browse published Team Briefs and express interest in a specific slot  
**So that** I can signal directly to a hiring manager that I am available and interested in being part of that team

**Acceptance Criteria:**
- Candidates see a "Team Opportunities" section on their dashboard — lists published `ACTIVE` Team Briefs (anonymised: company not revealed until reveal, but role titles, required skills, and team context are shown)
- Candidate can express interest in a specific slot (not the brief as a whole)
- Interest expression is visible to the hiring manager in the per-slot results list — interested candidates are surfaced at the top with an "Interest" badge
- Candidate can withdraw interest at any time before an invite is sent
- Candidate can only express interest in slots where they meet the tier floor (hard gate — prevents noise for managers)
- Interest expression on a slot contributes +30 Active Excellence points (signals active job-seeking behaviour)

**Components to Create:**
- `TeamOpportunitiesComponent` (`candidate/team-opportunities/`) — list of published briefs; slot detail cards with "Express Interest" button
- `SlotInterestBadgeComponent` (`candidate/team-opportunities/slot-interest-badge/`) — shown on candidate's dashboard after expressing interest: role, team context, status (pending / invite sent / closed)

**Backend:**
- `GET /api/team-briefs/published` — candidate-facing list of active briefs (anonymised)
- `POST /api/team-briefs/{id}/slots/{slotId}/interest` — express interest; validates tier floor; awards points
- `DELETE /api/team-briefs/{id}/slots/{slotId}/interest` — withdraw interest

**Phase dependency:** Phase 4 (US-TB2)

---

### Epic: Slot Gap Recovery

#### US-TB8: System Detects Interview Failures and Recommends Contextual Replacements

**As a** hiring manager whose assembled team has a slot opened by a candidate declining or failing an interview  
**I want** the platform to automatically detect the gap and surface replacement recommendations that preserve the rest of the team's composition health  
**So that** I don't have to re-run a cold search from scratch and the replacement doesn't undo the balance the team already has

**Acceptance Criteria:**

*Gap detection:*
- A slot entry can transition to one of these post-invite states: `INVITE_SENT` → `ACCEPTED` / `DECLINED` / `INTERVIEW_FAILED` / `OFFER_REJECTED`
- Manager manually updates a candidate's slot status (e.g. marks as `INTERVIEW_FAILED` or `DECLINED`) from the roster panel — or a future integration with calendar/ATS triggers this automatically
- When any slot entry moves to `DECLINED`, `INTERVIEW_FAILED`, or `OFFER_REJECTED`, the slot's fill count drops and the brief status reverts from `FILLED` to `ACTIVE`
- A **gap alert banner** appears on the Team Brief Workspace: *"1 slot is now open: Senior Developer (3/4 filled). Replacement recommendations are ready."*
- The alert is also surfaced on the employer's brief list: affected briefs show a 🔴 gap indicator

*Replacement recommendation logic:*
- The engine generates replacement candidates for the newly open slot, but this time it is **composition-aware** — it knows the existing accepted candidates and optimises the replacement to maintain or improve the five Composition Health dimensions
- Replacement signals (layered on top of the standard US-TB3 signals):

  **a) Health-Preserving Replacement**
  The engine identifies which Composition Health dimensions would be at risk if a generic candidate filled the slot and biases selection toward candidates who reinforce them
  - If domain cohesion is currently `🟢 Strong`, the engine prefers candidates whose domain matches the team majority — and flags candidates that would weaken it
  - If stack coherence is currently `🟡 Watch` (e.g. 3 AWS + 1 Azure), the engine prefers AWS candidates to resolve rather than deepen the split
  - Justification label: *"Chosen to maintain your team's FinTech domain cohesion — 9 of 13 remaining candidates share this domain"*

  **b) Synergy Extension**
  If any of the replacement candidates have shared work history with *existing accepted candidates* (not just other shortlisted candidates), they are surfaced with an elevated synergy signal
  - Justification label: *"Worked with your already-accepted Senior Dev [Alias X] at Company Y for 2 years — synergy carries over"*

  **c) Previously Thumbs-Down Excluded**
  Candidates the manager previously dismissed (thumbs-down in US-TB3) are excluded from replacement suggestions by default — manager can toggle "Show previously dismissed" to override

  **d) Interest-First Prioritisation**
  Candidates who expressed slot interest (US-TB6) for this specific slot and were not yet contacted are surfaced first in the replacement list — they have already signalled availability
  - Justification label: *"Expressed interest in this slot — already signalling availability"*

*Replacement workflow:*
- The gap alert banner has a **"View Replacements"** button that opens the replacement panel inline — no need to navigate away from the workspace
- Replacement panel shows up to 10 ranked candidates with their signals and composition impact preview
- Each replacement card shows a **"What changes?"** composition delta: which health dimensions would improve, stay the same, or worsen if this candidate fills the slot
- Manager can add to the shortlist directly from the replacement panel and trigger a single reveal + invite (not a full bulk re-invite)
- If a candidate declines a *second time* (re-fill attempt), the system flags the slot as `PERSISTENTLY_OPEN` and escalates: *"This slot has had 2 declined candidates. Consider reviewing the slot criteria or brief context."*

*Slot status lifecycle:*
```
SHORTLISTED → INVITE_SENT → ACCEPTED
                          → DECLINED        → triggers gap alert + replacement
                          → INTERVIEW_FAILED → triggers gap alert + replacement
                          → OFFER_REJECTED   → triggers gap alert + replacement
```

**Components to Create:**
- `SlotGapAlertBannerComponent` (`employer/team-brief/slot-gap-alert/`) — sticky banner on workspace when a gap exists; slot name, count, "View Replacements" CTA
- `ReplacementPanelComponent` (`employer/team-brief/replacement-panel/`) — inline panel; ranked replacement candidates with composition delta preview per card
- `CompositionDeltaChipComponent` (`employer/team-brief/replacement-panel/composition-delta/`) — compact indicator per health dimension: `↑ improves` / `→ neutral` / `↓ worsens`
- Extend `RosterPanelComponent` — per-candidate status chips with dropdown: Accepted / Declined / Interview Failed / Offer Rejected
- Extend `TeamBriefListComponent` — 🔴 gap indicator on briefs with open slots post-invite

**Backend:**
- `PATCH /api/team-briefs/{id}/slots/{slotId}/shortlist/{alias}/status` — update candidate slot status; body: `{ status: 'ACCEPTED' | 'DECLINED' | 'INTERVIEW_FAILED' | 'OFFER_REJECTED' }`; triggers gap detection logic on non-ACCEPTED terminal states
- `GET /api/team-briefs/{id}/slots/{slotId}/replacements` — generate composition-aware replacement recommendations for the open slot; returns `ReplacementRecommendationDto[]` each with: candidate summary, signals[], compositionDelta (per-dimension impact)
- `ReplacementEngineService` — extends `RecommendationEngineService`; loads the current accepted roster state before running signals so composition-preserving logic has full team context; runs synergy extension pass against accepted (not just shortlisted) candidates

**New entity:**
- `SlotCandidateStatus (id, slotShortlistEntryId, status, updatedAt, updatedBy)` — audit trail of status transitions per candidate per slot

**Phase dependency:** Phase 4 (US-TB5)

#### US-A27: Admin Manages Team Template Library

**As** an admin  
**I want** to create and manage reusable Team Templates — named slot configurations for common squad types  
**So that** hiring managers can start from a pre-built composition rather than defining all slots from scratch

**Acceptance Criteria:**
- Admin creates a template: name (e.g. "Agile Delivery Pod", "Data Science Team", "DevOps Squad"), description, slot list (same fields as US-TB1 slots)
- Template status: `DRAFT` / `ACTIVE` / `ARCHIVED` — only `ACTIVE` templates appear in the brief builder selector
- Admin can view usage stats: total briefs created from this template, most-swapped slot (which slot managers most often customise away from the template default)
- Templates are versioned — updating a template does not alter briefs already created from it

**Components to Create:**
- `TeamTemplateLibraryComponent` (`admin/team-templates/`) — list with usage stats; create/edit/archive
- `TeamTemplateEditorComponent` (`admin/team-templates/editor/`) — template metadata + slot list editor (same `SlotEditorCardComponent` reused from US-TB1)

**Backend:**
- `GET /api/admin/team-templates` — full library including drafts
- `POST /api/admin/team-templates` — create template with slots
- `PUT /api/admin/team-templates/{id}` — update template + slots
- `PATCH /api/admin/team-templates/{id}/status` — publish or archive
- `GET /api/admin/team-templates/{id}/stats` — usage count + most-swapped slot

**Phase dependency:** Phase 4 (US-TB1)

---

## Data Model Summary

| Entity | Owned by | Key fields |
|--------|----------|-----------|
| `TeamBrief` | US-TB1 | id, employerId, title, status, targetStartDate, teamTemplateId |
| `TeamBriefSlot` | US-TB1 | id, briefId, roleTitle, headcount, skills[], minExp, maxExp, preferredTier, domain, certs[] |
| `SlotShortlistEntry` | US-TB2 | id, slotId, candidateAlias, addedAt, source (`MANUAL` / `RECOMMENDATION`) |
| `BriefRecommendationFeedback` | US-TB3 | id, briefId, slotId, candidateAlias, signal (`UP` / `DOWN`) |
| `BriefCompositionHealthDismissal` | US-TB3 | id, briefId, dimension, acknowledgedAt, reason |
| `SlotInterestExpression` | US-TB6 | id, slotId, candidateId, expressedAt, withdrawn |
| `SlotCandidateStatus` | US-TB8 | id, slotShortlistEntryId, status, updatedAt, updatedBy |
| `TeamTemplate` | US-A27 | id, name, description, status, slots[] |
| `TeamTemplateSlot` | US-A27 | id, templateId, roleTitle, headcount, skills[], preferredTier, domain, certs[] |

---

## Flyway Migrations

| Script | Tables |
|--------|--------|
| `V25__Team_Brief.sql` | `team_briefs`, `team_brief_slots` |
| `V26__Slot_Shortlist.sql` | `slot_shortlist_entries` |
| `V27__Brief_Recommendation_Feedback.sql` | `brief_recommendation_feedback`, `brief_composition_health_dismissals` |
| `V28__Slot_Interest_Expression.sql` | `slot_interest_expressions` |
| `V29__Slot_Candidate_Status.sql` | `slot_candidate_statuses` |
| `V30__Team_Templates.sql` | `team_templates`, `team_template_slots` |

---

## Routing Plan (Angular)

```
/employer/briefs                        → TeamBriefListComponent
/employer/briefs/new                    → TeamBriefBuilderComponent (US-TB1)
/employer/briefs/:id/workspace          → TeamBriefWorkspaceComponent (US-TB2, US-TB3, US-TB4, US-TB8)
/employer/briefs/:id/workspace/replacements/:slotId → ReplacementPanelComponent (US-TB8)
/employer/briefs/:id/roster             → RosterPanelComponent (US-TB5)
/candidate/team-opportunities           → TeamOpportunitiesComponent (US-TB6)
/admin/team-templates                   → TeamTemplateLibraryComponent (US-A27)
/admin/team-templates/:id/edit          → TeamTemplateEditorComponent (US-A27)
```

---

## Story Summary

| Story | Title | Points | Dependencies | Estimate |
|-------|-------|--------|--------------|----------|
| **US-TB1** | Team Brief authoring | 8 | Phase 3 complete | 1 sprint |
| **US-TB2** | Per-slot candidate search | 10 | US-TB1 | 1 sprint |
| **US-TB3** | Ideal Squad sidebar + Team Composition Health Score | 20 | US-TB2 | 2.5 sprints |
| **US-TB4** | Drag-and-drop roster assembly | 8 | US-TB2, US-TB3 | 0.5 sprint |
| **US-TB5** | Draft Roster output (PDF, share, bulk invite) | 10 | US-TB4, US 1.8 | 1 sprint |
| **US-TB6** | Candidate slot interest expression | 6 | US-TB2 | 0.5 sprint |
| **US-TB8** | Slot gap detection + composition-aware replacement | 12 | US-TB5, US-TB3 | 1.5 sprints |
| **US-A27** | Admin: Team Template Library | 6 | US-TB1 | 0.5 sprint |

---

## Key Design Decisions

**1. Employer vs Hiring Manager — who owns the brief?**  
The `EMPLOYER` account creates and owns the brief (they are the business). The `HIRING_MANAGER` role acts as a delegate — they can be assigned to a brief by the employer and have full workspace access. Initially these can be treated as interchangeable; the delegation layer is a Phase 5 concern.

**2. Identity reveal is still gated**  
The entire Team Brief workflow operates on aliases until the bulk invite is triggered. Managers see tier, scores, skills, and pathway progress — but no PII. This preserves the platform's zero-PII model and keeps the reveal monetization gate intact.

**3. Recommendation engine is rules-based first, ML second**  
The five per-candidate recommendation signals and the five team composition health dimensions are all deterministic rules in Phase 4. The synergy cluster detection is a SQL query against `company_alumni` with date-range overlap. Stack coherence is a grouping query on `skills[]`. Knowledge freshness joins `CandidateAssessmentResult` against slot skill filters. No ML inference is required to launch — the rules produce meaningful, explainable justifications. ML ranking can layer on top in Phase 5 when sufficient usage data exists.

**4. Synergy cluster detection relies on Company Alumni data (US-R5)**  
The shared-history signal is only as good as the alumni data. It depends on candidates having added company history to their Living CV and the admin having verified those companies (US-A24). This is a soft dependency — the engine simply omits the synergy signal if insufficient alumni data exists.

**5. Role Profiles (Phase 5 concern)**  
The Team Brief slot definition (`roleTitle`, `skills[]`, `minExp`, `domain`) is a lightweight inline spec. A future **Role Profile Library** (US-A28, Phase 5) would allow admin to pre-define reusable role specs that slots reference by ID — similar to the relationship between Career Pathways (supply-side) and Role Profiles (demand-side). This is intentionally deferred.

---

> **Next phase:** Phase 5 — Role Profile Library, ML-based recommendation ranking, employer/hiring manager delegation model, team performance tracking post-placement.
