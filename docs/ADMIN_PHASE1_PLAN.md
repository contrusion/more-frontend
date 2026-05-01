# Admin Phase 1 — User Stories & Feature Plan

> **Role in focus:** `ADMIN` (`MO_ADMIN` Keycloak role)  
> **Guarded by:** `RoleGuard` on the `/admin` route in `app.routes.ts`  
> **Backend:** `@PreAuthorize("hasRole('ADMIN')")` — all endpoints under `/api/admin/**`  
> **Existing admin entry point:** `AdminComponent` → `/admin/outreach-ml` (ML dataset export, already live)

---

## Context

The platform currently has five user roles: `APPLICANT`, `RECRUITER`, `EMPLOYER`, `HIRING_MANAGER`, and `ADMIN`.  
The admin user is the platform operator — responsible for platform health, user governance, content moderation, ML data pipeline oversight, and analytics dashboards that no other role can access.

The existing admin shell (`AdminComponent`) is already wired with a sidebar card grid and a child `<router-outlet>`, so new admin sections slot in as lazy-loaded child routes.

---

## Epic 1 — User Management

### US-001 · View all platform users (paginated)
**As** an admin  
**I want** to browse a paginated, searchable list of all registered users  
**So that** I can audit who is on the platform and understand the user base at a glance

**Acceptance criteria:**
- Table shows: full name, email, account types (`APPLICANT`, `RECRUITER`, etc.), registration date, premium status
- Filterable by account type and premium flag (mirrors the stubbed `AdminController.listUsers` endpoint)
- Paginated (default 20 per page)
- Search by name or email

**Backend:** `GET /api/admin/users?page=&size=&types=&premium=` (stub exists — needs full implementation)

---

### US-002 · View individual user profile
**As** an admin  
**I want** to click into any user and see their full profile details  
**So that** I can investigate issues, verify identity, or review their data

**Acceptance criteria:**
- Shows all `AppUser` fields: name, email, phone, group, LinkedIn/portfolio URLs, DOB, account types
- For `APPLICANT` users: link to view their Living CV summary (read-only)
- For `RECRUITER` users: shows company association and posted job advertisements count

**Backend:** `GET /api/admin/users/{userId}`

---

### US-003 · Assign / revoke user roles
**As** an admin  
**I want** to add or remove account types from a user  
**So that** I can promote a candidate to recruiter, or revoke access when needed

**Acceptance criteria:**
- Multi-select role checkboxes for all values in `AccountType` enum (`RECRUITER`, `APPLICANT`, `HIRING_MANAGER`, `EMPLOYER`, `ADMIN`)
- Confirmation dialog before saving
- Change is reflected in Keycloak and synced to `user_types` table
- Audit log entry created for the change

**Backend:** `PATCH /api/admin/users/{userId}/roles`

---

### US-004 · Suspend / reactivate a user account
**As** an admin  
**I want** to suspend a user's account  
**So that** I can enforce platform policies without permanently deleting data

**Acceptance criteria:**
- Suspended users receive a 403 on all protected API calls
- Admin UI shows a "Suspended" badge on the user row
- Admin can reactivate with one click
- Suspension reason is recorded (free-text field, required)

**Backend:** `PATCH /api/admin/users/{userId}/status` — uses `AccountStatusInfo` entity (already in domain)

---

## Epic 2 — Recruitment Content Moderation

### US-005 · View all job advertisements (platform-wide)
**As** an admin  
**I want** to see every job advertisement posted on the platform  
**So that** I can identify inappropriate, outdated, or duplicate listings

**Acceptance criteria:**
- Table shows: title, company, recruiter name, job type, experience level, salary range, posted date, status
- Filterable by job type, experience level, and active/inactive status
- Recruiter-scoped view already exists (`GET /api/job-advertisements/{recruiterId}`); admin needs unscoped view

**Backend:** `GET /api/admin/job-advertisements?page=&size=&status=`

---

### US-006 · Remove or flag an inappropriate job advertisement
**As** an admin  
**I want** to take down a job advertisement that violates platform policy  
**So that** candidates are not exposed to fraudulent or harmful listings

**Acceptance criteria:**
- "Flag" action marks the listing for review (visible to recruiter as a warning)
- "Remove" action unpublishes the listing immediately
- Both actions require a reason (dropdown: Fraudulent / Inappropriate content / Duplicate / Other)
- Recruiter receives an in-app notification with the reason

**Backend:** `PATCH /api/admin/job-advertisements/{id}/status`

---

### US-007 · View all job applications (platform-wide)
**As** an admin  
**I want** to browse all job applications across all recruiters and companies  
**So that** I can monitor application volume, detect abuse, and support dispute resolution

**Acceptance criteria:**
- Shows: applicant name, job title, company, status (`ApplicationStatus` enum), applied date
- Filterable by `ApplicationStatus`: `SUBMITTED`, `REVIEWED`, `SCREENING`, `INTERVIEWING`, `ASSESSMENT`, etc.
- Clicking an application opens a read-only detail view

**Backend:** `GET /api/admin/applications?page=&size=&status=`

---

## Epic 3 — Candidate Quality & Class Oversight

### US-008 · View candidate class distribution
**As** an admin  
**I want** to see a breakdown of how many candidates are Gold, Silver, and Bronze class  
**So that** I can monitor platform engagement and the effectiveness of the ranking system

**Acceptance criteria:**
- Summary card shows counts and percentages for each class
- Bar/pie chart visualisation
- Trend over time (last 30 / 90 days)
- Drilldown to list of candidates in each class

**Backend:** `GET /api/admin/analytics/candidate-classes`

---

### US-009 · View top-performing candidates (Gold class leaderboard)
**As** an admin  
**I want** to see which candidates are ranked Gold and understand their engagement metrics  
**So that** I can showcase platform success and identify users for case studies

**Acceptance criteria:**
- Sortable table: name, class, total goals, completed goals, verified proofs, last active
- Export to CSV
- Links to read-only candidate Living CV

**Backend:** `GET /api/admin/candidates/leaderboard?class=GOLD&page=&size=`

---

### US-010 · View candidates with stale or inactive profiles
**As** an admin  
**I want** to identify candidates who haven't updated their profile in 90+ days  
**So that** I can trigger re-engagement campaigns or clean up zombie accounts

**Acceptance criteria:**
- Filter: no activity in last 30 / 60 / 90 / 180 days
- Bulk action: send re-engagement email notification
- Shows: last login, last CV update, total goals, class

**Backend:** `GET /api/admin/candidates/inactive?daysSince=90`

---

## Epic 4 — Recruiter & Interaction Oversight

### US-011 · View all recruiter interactions platform-wide
**As** an admin  
**I want** to see all recruiter–applicant interactions  
**So that** I can monitor for inappropriate behaviour and ensure platform quality

**Acceptance criteria:**
- Table shows: recruiter, applicant, status (`NEW`, `ACTIVE`, `STALE`, `CLOSED`), initiated date, event count
- Filterable by `InteractionStatus`
- Clicking an interaction opens the full event timeline (read-only)
- External LinkedIn interactions (where recruiter is null) are clearly labelled

**Backend:** `GET /api/admin/interactions?page=&size=&status=`

---

### US-012 · View recruiter performance summary
**As** an admin  
**I want** to see a per-recruiter breakdown of their activity on the platform  
**So that** I can identify high-performing and underperforming recruiters

**Acceptance criteria:**
- Table: recruiter name, company, total interactions, active interactions, stale rate, job ads posted, applications received
- Sortable by any metric
- Exportable to CSV

**Backend:** `GET /api/admin/recruiters/performance`

---

## Epic 5 — ML Data Pipeline & Dataset Management

### US-013 · Export outreach email dataset for ML training (existing feature)
**As** an admin  
**I want** to export labeled recruiter interaction emails as a CSV dataset  
**So that** I can retrain the outreach classification ML model

**Acceptance criteria:**
- Already implemented at `/admin/outreach-ml` via `DatasetExportComponent`
- Export includes: email body, labels, metadata
- Download triggers `IRecruitmentDatasetService`

> **Status:** ✅ Live — `GET /api/email/dataset/export` in `EmailController`

---

### US-014 · View ML dataset export history
**As** an admin  
**I want** to see a log of all previous dataset exports  
**So that** I can track when the model was last retrained and ensure data freshness

**Acceptance criteria:**
- Table: export date, exported by, record count, file size, download link
- Each export is retained for 90 days

**Backend:** `GET /api/admin/ml/export-history`

---

### US-015 · View interaction event label distribution
**As** an admin  
**I want** to see a breakdown of interaction event types and their classified labels  
**So that** I can assess dataset balance before triggering a retraining cycle

**Acceptance criteria:**
- Bar chart: label vs count (e.g. Outreach / Follow-up / Rejection / Offer)
- Unlabelled event count highlighted in amber
- Filter by date range

**Backend:** `GET /api/admin/ml/label-distribution?from=&to=`

---

## Epic 6 — Platform Analytics Dashboard

### US-016 · Platform-wide KPI dashboard (home screen)
**As** an admin  
**I want** to land on a dashboard showing key platform health metrics  
**So that** I have an at-a-glance view of platform activity without navigating to individual sections

**Acceptance criteria:**
- Metrics cards: total users, active this week, new registrations (last 30 days), total job ads, total applications, total interactions
- Each card links to the relevant management section
- Sparkline trend for each metric (last 30 days)

**Backend:** `GET /api/admin/analytics/overview`

---

### US-017 · User registration trend report
**As** an admin  
**I want** to see how user registrations trend over time, broken down by account type  
**So that** I can understand platform growth and which user type is growing fastest

**Acceptance criteria:**
- Line chart: registrations per week for the last 6 months
- Colour-coded by account type
- Export to CSV

**Backend:** `GET /api/admin/analytics/registrations?from=&to=&groupBy=week`

---

## Epic 7 — System Configuration

### US-018 · Manage candidate class thresholds
**As** an admin  
**I want** to configure the scoring thresholds that determine Gold / Silver / Bronze class  
**So that** I can tune the ranking system as the platform matures

**Acceptance criteria:**
- Three editable numeric fields: Gold minimum score, Silver minimum score
- Preview shows how the current candidate base would redistribute under new thresholds
- Confirmation before saving; change is logged

**Backend:** `GET/PUT /api/admin/config/class-thresholds`

---

### US-019 · View and manage feature flags
**As** an admin  
**I want** to toggle platform features on or off without a deployment  
**So that** I can safely roll out new features to subsets of users

**Acceptance criteria:**
- List of all registered flags with their current state (enabled / disabled)
- Toggle control with confirmation dialog
- Optional: scope flag to specific account types or user groups

**Backend:** `GET /api/admin/config/feature-flags`, `PATCH /api/admin/config/feature-flags/{key}`

---

## Routing Plan (Angular)

All admin child routes are lazy-loaded under the existing `/admin` parent:

```
/admin                        → AdminComponent (dashboard overview — US-016)
/admin/users                  → UserListComponent (US-001)
/admin/users/:id              → UserDetailComponent (US-002, US-003, US-004)
/admin/job-ads                → JobAdModerationComponent (US-005, US-006)
/admin/applications           → ApplicationsOversightComponent (US-007)
/admin/candidates/classes     → CandidateClassDashboardComponent (US-008, US-009)
/admin/candidates/inactive    → InactiveCandidatesComponent (US-010)
/admin/interactions           → InteractionOversightComponent (US-011)
/admin/recruiters             → RecruiterPerformanceComponent (US-012)
/admin/outreach-ml            → DatasetExportComponent (US-013) ← exists
/admin/ml/history             → MlExportHistoryComponent (US-014, US-015)
/admin/config/classes         → ClassThresholdConfigComponent (US-018)
/admin/config/flags           → FeatureFlagsComponent (US-019)
```

---

## Priority Matrix

| Story | Value | Effort | Priority |
|-------|-------|--------|----------|
| US-001 User list | High | Low | 🔴 P1 |
| US-002 User profile | High | Low | 🔴 P1 |
| US-016 KPI dashboard | High | Medium | 🔴 P1 |
| US-004 Suspend account | High | Low | 🔴 P1 |
| US-003 Assign roles | High | Medium | 🔴 P1 |
| US-005 View all job ads | Medium | Low | 🟡 P2 |
| US-006 Remove job ad | Medium | Low | 🟡 P2 |
| US-008 Class distribution | Medium | Medium | 🟡 P2 |
| US-011 Interaction oversight | Medium | Medium | 🟡 P2 |
| US-013 ML export | — | — | ✅ Done |
| US-007 Applications overview | Medium | Medium | 🟡 P2 |
| US-009 Leaderboard | Low | Low | 🟢 P3 |
| US-010 Inactive candidates | Low | Medium | 🟢 P3 |
| US-012 Recruiter performance | Low | Medium | 🟢 P3 |
| US-014/015 ML history | Low | Medium | 🟢 P3 |
| US-017 Registration trends | Low | Medium | 🟢 P3 |
| US-018 Class thresholds | Low | High | 🟢 P3 |
| US-019 Feature flags | Low | High | 🟢 P3 |
