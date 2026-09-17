# Recruitment App Extension - Phase 3 Plan & User Stories

> Phase 3 completes the platform before monetization — giving recruiters full candidate discovery (Talent Search across all tiers including unclassified), an applicant interest list per job ad, structured company alumni selection, and a personalised/learnable Quick Access experience for all users.

## Context

**Phase 3 Theme: Platform Feature Completion**

Phase 3 completes the core recruiter tooling and platform-wide UX features that make the platform useful at scale — before monetization is switched on. By the end of Phase 3, recruiters can discover any candidate in the registry, track applicant interest per job ad, and navigate the platform efficiently. Candidates see a personalised Quick Access experience.

**Prerequisites from Phase 1 & 2:**
- ✅ Alias system + zero-PII public Living CV (US 1.3a)
- ✅ Candidate Pool recruiter search (US-R3)
- ✅ Job Ads + Interest Expression (US-R1, US-C1)
- ✅ Market Readiness Score + tiers (US-P1 — Phase 2)
- ✅ Home page Quick Access tile grid stable

---

## Implementation Order

| Sprint | Stories | Rationale |
|--------|---------|-----------|
| **Sprint 13** | US-R4 (Talent Search), US-R6 (Applicant Interest List) | Recruiter discovery tooling |
| **Sprint 14** | US-R5 (Company Alumni Multi-Select), US-H1 (Dynamic Quick Access) | Job ad enrichment + platform personalisation |
| **Sprint 15** | Polish, integration tests, handover to Monetization phase | Stability |

---

## Phase 3 Stories

### Epic: Recruiter Discovery Tooling

#### US-R4b: Recruiter Sees Talent Persona and Availability in Search Results

**As a** recruiter  
**I want to** see a candidate's Talent Persona and availability signal in search and candidate cards  
**So that** I can prioritize outreach based on whether someone is actively seeking work, warming up, or effectively passive

**Acceptance Criteria:**
- Candidate rows and detail modals show a persona badge: Passive Prospect / Warm Lead / Active Job Seeker
- Active Job Seeker shows an "Available Immediately" indicator; Warm Lead shows "Available in X months"
- Passive Prospect remains visible only to verified recruiters and is labelled as low-visibility / not immediately available
- Recruiter filters can sort by persona and availability state, without exposing private candidate data beyond the alias-safe summary
- Persona is included in the candidate card summary and any recruiter-facing analytics export

**Backend changes required:**
- Extend `CandidateSearchResultDto` to include `talentPersona` and `availableInMonths`
- Filter and sort logic considers talent persona when ranking or prioritising candidate cards

**Phase:** Phase 3  
**Dependencies:** US-P3, US-R4, US 1.3a

---

#### US-R4: Recruiter Can Search the Full Candidate Registry

**As a** recruiter
**I want to** search across all registered candidates by keyword, role, industry, and experience level — including those with no Market Readiness tier yet assigned
**So that** I can discover early-stage talent and fill niche roles beyond the curated Candidate Pool

**Distinction from Candidate Pool (US-R3):**
| | Candidate Pool | Talent Search |
|---|---|---|
| Route | `/recruiter/candidates` | `/search` |
| UX pattern | Browse-first, filter pills | Search-bar-first, results on input |
| Candidate scope | Classified only | All registered, including Unclassified |
| Sort default | Tier descending | Last-updated descending |

**Acceptance Criteria:**
- Search bar accepts free-text matched against role category, job title, industry
- Filters: Role Category, Industry, Experience Group (< 5 yrs / 5+ yrs), Tier (All-Star / Platinum / Gold / Silver / Bronze / Unclassified)
- Results include all candidates with a `publicAlias`, including those where `marketReadinessTier = null`
- Unclassified candidates display a neutral "Unclassified" badge — no tier colour
- Paginated (20 per page, last-updated descending by default)
- "View CV" opens the same Living CV modal used in Candidate Pool (reuse pattern)
- No PII returned — alias only
- `TALENT_SEARCH` tile exists in Quick Access for `RECRUITER` role (already stubbed)

**Components to Create:**
- `TalentSearchComponent` (`recruiter/talent-search/talent-search.component.ts`) — search bar + filter bar + results table
- Reuse `CandidateClassBadgeComponent` for tier badges
- Reuse Living CV modal pattern from `CandidateSearchComponent`

**Services to Create / Update:**
- Extend `CandidateSearchService` to accept `keyword`, `roleCategory`, `industry` params; OR create `TalentSearchService` if query shape diverges

**Backend changes required:**
- `GET /api/recruiters/candidates` — add optional `keyword`, `roleCategory`, `industry` query params
- `marketReadinessTier` filter must accept `null`/`UNCLASSIFIED` sentinel
- `CandidateSearchResultDto` — no structural change; `marketReadinessTier` nullable already

**Data Model (frontend):**
```typescript
type TierFilterExtended = MarketReadinessTier | 'UNCLASSIFIED' | null;

interface TalentSearchParams {
  keyword?: string;
  roleCategory?: string;
  industry?: string;
  marketReadinessTier?: TierFilterExtended;
  experienceGroup?: ExperienceGroup;
  page: number;
  size: number;
}
```

**Estimated Endpoints:**
- `GET /api/recruiters/candidates?keyword=java&roleCategory=BACKEND&industry=Fintech&page=0&size=20`
- `GET /api/recruiters/candidates?tierAssigned=false&page=0&size=20`

**Phase:** Phase 3 — Sprint 13
**Dependencies:** US-R3 stable; `CandidateClassBadgeComponent` and Living CV modal reusable; US-P1 (tier field on `CandidateSearchResultDto`)

---

#### US-R6: Recruiter Views Applicants Who Have Shown Interest

**As a** recruiter who has posted a job advertisement
**I want to** see a list of candidates who have expressed interest in my job ad
**So that** I can review their Living CVs and decide who to advance in the hiring process

**Acceptance Criteria:**
- Recruiter navigates to a job ad and sees an "Applicants" tab listing candidates with status `APPLIED`
- Each row shows: alias, tier badge, Market Readiness score, date of interest expressed, "View CV" action
- Recruiter can filter by tier (Platinum / Gold / Silver / Bronze)
- "View CV" opens `PublicLivingCv` modal — alias-safe
- Candidates who have withdrawn interest are excluded
- "Reveal Identity" button present but disabled with tooltip: *"Identity reveal available in Monetization phase"*
- Empty state: *"No candidates have shown interest yet. Share your job ad to attract applicants."*

**Components to Create:**
- `ApplicantInterestListComponent` (`recruiter/job-ads/applicant-interest-list/`) — table with alias, tier badge, score, date, View CV
- `ApplicantInterestFilterComponent` (`recruiter/job-ads/applicant-interest-list/applicant-interest-filter/`) — tier filter chips

**Components to Update:**
- `JobAdsListComponent` — add navigation to applicant list per ad

**Services to Create:**
- `ApplicantInterestService` (`recruiter/services/applicant-interest.service.ts`) — `getInterestedCandidates(jobAdId, tierFilter, page)`

**Estimated Endpoints:**
- `GET /api/recruiters/{id}/job-ads/{jobAdId}/interested-candidates?marketReadinessTier=GOLD&page=0&size=20`
- `DELETE /api/candidates/{id}/interests/{interestId}` — candidate withdraws interest

**Phase:** Phase 3 — Sprint 13
**Dependencies:** US-R1 (job ad exists), US-C1 (interest expression), US 1.3a (alias system), US-P1 (tier on DTO)

---

#### US-R5: Job Ad — Company Alumni Multi-Select from Companies Table

**As a** recruiter creating or editing a job advertisement
**I want to** select preferred company alumni from a searchable list of known companies
**So that** selection is consistent, avoids typos, and links to real company records

**Acceptance Criteria:**
- "Company Alumni" field replaced with a PrimeNG `p-multiselect` or `p-autoComplete` backed by `GET /api/companies?search=<term>`
- If a company is not found, recruiter can enter a **website URL** as fallback — platform enqueues a background job to look up / create the company record
- Selected companies stored as `company_id` references (not free-text strings)
- At most 10 company alumni per job ad — backend enforces with a validation error
- Existing free-text `companyAlumni` field deprecated and removed from `JobAdvertisementCreateRequest` / `JobAdvertisementUpdateRequest`

**Components to Update:**
- `JobAdFormComponent` — replace free-text chip input with `p-multiselect`; add "Not found? Enter website URL" fallback

**Backend changes required:**
- New endpoint: `GET /api/companies?search=<term>&size=20` — returns `{ id, name, logoUrl }`
- New join table: `job_advertisement_company_alumni (job_advertisement_id, company_id)` — Flyway migration
- `JobAdvertisementDto` gains `companyAlumni: { id: string; name: string; logoUrl: string }[]`
- `POST /api/companies/from-url` — background job to create company from URL (async, `202 Accepted`)

**Phase:** Phase 3 — Sprint 14
**Dependencies:** US-R1 (job ad form stable), Companies table queryable via API

---

### Epic: Platform Personalisation

#### US-H1: Dynamic & Personalised Quick Access

**As a** user of the More platform (any role)
**I want** the Quick Access section to adapt to how I actually use the app, and to let me customise it myself
**So that** the features I reach most are always one click away

**Acceptance Criteria:**

*Learning mode:*
- Every navigation via Quick Access tile or sidebar records a `UserNavigationEvent` (route + timestamp + userId) server-side
- After 10+ events, platform computes "top 5 most visited" and reorders Quick Access tiles accordingly
- Recalculation: on login + after every 5th navigation event (debounced)

*Customisation mode:*
- "Customise" button (pencil icon) in Quick Access header opens edit mode
- Tiles become draggable (Angular CDK `DragDropModule`); user can reorder, pin, or hide any tile
- Pinned tiles always appear first, immune to learning algorithm
- Hidden tiles appear as greyed-out cards in edit mode with a "Show" toggle
- "Reset to defaults" reverts manual customisation and learned order

*Role awareness:*
- Available tile set filtered by role — personalisation only affects order/visibility within the allowed set
- New tiles from role change appear at the bottom (unranked) until promoted

*Persistence:*
- Stored server-side — survives device changes
- Not stored in `localStorage` or `sessionStorage`

**Components to Create / Update:**
- `QuickAccessSectionComponent` (`home/components/quick-access-section/`) — replaces static tile grid in `HomeComponent`
- `TileCustomiseModalComponent` (`home/components/tile-customise-modal/`) — draggable list, visibility toggles, "Reset" button
- `QuickAccessService` (`shared/services/quick-access.service.ts`) — `getConfig()`, `saveConfig(config)`, `recordNavigationEvent(tileId)`, `resetConfig()`

**Backend changes required:**
- New entity: `UserNavigationEvent (id, userId, tileId, visitedAt)` — append-only; 90-day retention
- New entity: `UserQuickAccessConfig (userId, tileId, pinned, hidden, manualOrder)`
- Flyway migration: `V17__Add_Navigation_Events.sql`
- `POST /api/users/me/navigation-events` — record a navigation event (called silently)
- `GET /api/users/me/quick-access` — returns ordered tile list (manual pins → learned order → defaults)
- `PUT /api/users/me/quick-access` — save full custom configuration
- `DELETE /api/users/me/quick-access` — reset to defaults

**Data Model:**
```typescript
QuickAccessTile {
  tileId: string
  title: string
  route: string
  pinned: boolean
  hidden: boolean
  manualOrder?: number
  visitCount: number
  learnedRank: number
}
```

**Phase:** Phase 3 — Sprint 14
**Dependencies:** `HomeComponent` static tile grid stable

---

## Story Breakdown Summary — Phase 3

| Story | Focus | Sprint | Dependencies | Estimated Effort |
|-------|-------|--------|--------------|-----------------|
| **US-R4** | Talent Search — full registry browse | 13 | US-R3, US-P1 | 1 sprint |
| **US-R6** | Recruiter views interested applicants | 13 | US-R1, US-C1, US 1.3a | 0.5 sprint |
| **US-R5** | Company Alumni multi-select | 14 | US-R1, Companies API | 1 sprint |
| **US-H1** | Dynamic & Personalised Quick Access | 14 | Home page stable | 1.5 sprints |

---

## New File Structure (Phase 3)

```
src/app/functional-features/recruitment/
└── recruiter/
    ├── talent-search/
    │   └── talent-search.component.ts             # US-R4
    ├── job-ads/
    │   └── applicant-interest-list/               # US-R6
    │       └── applicant-interest-filter/
    └── services/
        └── applicant-interest.service.ts          # US-R6

src/app/functional-features/home/
└── components/
    ├── quick-access-section/                       # US-H1
    └── tile-customise-modal/                       # US-H1

src/app/shared/
└── services/
    └── quick-access.service.ts                    # US-H1
```

---

## Flyway Migrations (Phase 3)

| Migration | Description | Story |
|-----------|-------------|-------|
| `V16__Add_Job_Ad_Company_Alumni.sql` | `job_advertisement_company_alumni` join table; drop free-text column | US-R5 |
| `V17__Add_Navigation_Events.sql` | `user_navigation_events`, `user_quick_access_configs` | US-H1 |

---

## Next: Monetization

See [MONITIZATION.md](MONITIZATION.md) for the Identity Reveal workflow, Stripe subscriptions, Company portal, and Compliance stories (US 1.8, US 1.9, US 1.10).
