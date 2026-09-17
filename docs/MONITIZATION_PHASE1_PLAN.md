# Monetization Plan — Identity Reveal & Company Portal

## Overview

Monetization is deliberately the **last phase** — it is only valuable once:
1. Candidates have rich, verified Living CVs (Phase 1)
2. The Market Readiness Engine gives companies a quantified signal of candidate fit (Phase 2)
3. Recruiter tooling (Talent Search, Applicant Lists) has driven platform adoption (Phase 3)

At that point, companies are looking at a scored, alias-protected talent pool they cannot access without paying — the reveal is worth buying.

---

## Revenue Model

| Pathway | Trigger | Fee |
|---------|---------|-----|
| **Subscription — PRO/ENTERPRISE** | Active subscriber with reveals remaining | 10–12% discounted placement fee |
| **Contingency** | No subscription or quota exhausted | 20–30% placement fee via Stripe one-time |

---

## Strategic Decisions

1. **Identity Reveal (US 1.8 + US 1.9)** is the primary revenue mechanism — companies pay to unlock candidate identities.
2. **`COMPANY` Keycloak role** — new role for the company portal; separate from `RECRUITER`.
3. **Stripe** — subscriptions and one-time reveal transactions. Webhooks confirm payment before identity is served.
4. **`RevealAuditLog` written atomically** — never serve real identity unless the audit row write succeeds (single transaction).
5. **`RevealService` (frontend) must never reuse `LivingCvService`** — separate service, separate endpoint, no shared code path.
6. **No optimistic reveals** — Stripe webhook must confirm payment before `REVEALED` status is set.
7. **Refresh strategy must be costed into monetization** — whichever approach we choose for near-real-time score updates (polling, save-triggered refresh, websocket updates, or another event-driven pattern), the hosting, compute, and operational cost must be included in the monetization model and pricing assumptions. This is not a purely technical decision; it affects customer-facing cost-to-serve as the platform scales.

---

## Prerequisites

- ✅ Alias system enforced server-side (US 1.3a)
- ✅ Privacy controls active (US 1.5 — Phase 2)
- ✅ Market Readiness Score + tiers live (US-P1 — Phase 2) — gives companies a quantified reason to reveal
- ✅ Talent Search live (US-R4 — Phase 3) — companies can browse before revealing
- ✅ `COMPANY` Keycloak realm config in place

---

## Backend Security Pre-Condition (already enforced — US 1.3a)

- `GET /api/candidates/living-cv` (`APPLICANT` only) — returns full `LivingCvDto` with real PII.
- `GET /api/candidates/public/{alias}/living-cv` (`RECRUITER` only) — returns `PublicLivingCvDto` with **zero PII**.

The reveal endpoint must sit behind a new security layer:
- `RevealAuditLog` written **atomically** with the reveal response — transaction must include both or neither.
- A separate `RevealService` (frontend) must **never** reuse the public Living CV service.
- Stripe webhook confirms payment **before** the reveal response is returned — no optimistic reveals.
- `ILivingCvService.getRevealedLivingCv()` is the **only** code path that returns real identity fields.

---

## Stories

### Epic: Identity Reveal

#### US 1.8: Company Can Request Candidate Identity Reveal

**As a** company  
**I want to** request a candidate's real identity after reviewing their Market Readiness score and anonymised Living CV  
**So that** I can initiate direct hiring discussions

**Acceptance Criteria:**
- Company views anonymised Living CV (alias only) via `PublicLivingCvDto`
- "Request Identity" button visible on candidate cards in the company search view
- System checks subscription/payment status before serving any PII:
  - **Pathway A — Active subscriber with reveals remaining:** Unlock immediately; log discounted placement fee (10–12%); decrement `revealsRemaining`
  - **Pathway B — No subscription / quota exhausted:** Redirect to Stripe payment for contingency reveal (20–30% placement fee)
- Candidate receives email notification: *"Company X has requested to reveal your identity."*
- Reveal status tracked: `PENDING_PAYMENT | REVEALED | REJECTED`
- `RevealAuditLog` row written atomically with the reveal response
- No PII returned until payment confirmed via Stripe webhook

**Components to Create:**
- `IdentityRevealButtonComponent` (`company/components/identity-reveal-button/`) — checks subscription, triggers reveal or payment redirect
- `RevealRequestListComponent` (`candidate/components/reveal-requests/reveal-request-list/`) — candidate-facing list of who has requested their reveal
- `RevealRequestModalComponent` (`candidate/components/reveal-requests/reveal-request-modal/`) — candidate approval flow (activate in Compliance phase)

**Services to Create:**
- `RevealService` (`company/services/reveal.service.ts`) — `requestReveal(alias)`, `getRevealStatus(requestId)`. Must **never** reuse `LivingCvService`.
- `RevealRequestService` (`candidate/services/reveal-request.service.ts`) — `getMyRevealRequests()`

**Backend changes required:**
- New entity: `RevealAuditLog (id, revealRequestId, candidateId, companyId, revealedAt, pathway, placementFeePercentage, subscriptionTier, invoiceId)`
- New entity: `IdentityRevealRequest (id, candidateId, companyId, requestedAt, status, pathway, placementFeePercentage, revealedAt)`
- Flyway migrations for both tables (`V14__Add_Reveal_Tables.sql`)
- `ILivingCvService.getRevealedLivingCv(String candidateAlias, String companyId)` — validates reveal auth, writes audit log, returns `RevealedLivingCvDto`
- `POST /api/companies/{id}/reveal-requests` — create request, check subscription/payment, write audit log atomically
- `GET /api/candidates/{id}/reveal-requests` — candidate views who has requested their reveal
- `GET /api/companies/{id}/revealed-candidates` — company views all unlocked candidates
- Stripe webhook handler: `POST /api/webhooks/stripe` — confirms payment, transitions reveal status to `REVEALED`
- New `COMPANY` Keycloak role — add to realm config and `SecurityConfig`

**Data Model:**
```typescript
IdentityRevealRequest {
  id: string
  candidateId: string
  companyId: string
  requestedAt: Date
  status: RevealStatus              // PENDING_PAYMENT | REVEALED | REJECTED
  pathway: MonetizationPathway      // SUBSCRIPTION | CONTINGENCY
  placementFeePercentage: number    // 10–12 or 20–30
  revealedAt?: Date
}

RevealAuditLog {
  id: string
  revealRequestId: string
  candidateId: string
  companyId: string
  revealedAt: Date
  pathway: MonetizationPathway
  placementFeePercentage: number
  subscriptionTier?: string
  invoiceId?: string                // Stripe invoice
}
```

**Estimated Endpoints:**
- `POST /api/companies/{id}/reveal-requests`
- `GET /api/candidates/{id}/reveal-requests`
- `GET /api/companies/{id}/revealed-candidates`
- `POST /api/webhooks/stripe`

**Dependencies:** US 1.3a (alias system), US 1.5 (privacy controls), US 1.9 (subscription check must exist before reveal logic runs)

---

#### US 1.9: System Validates Company Subscription for Discounted Reveal

**As a** system  
**I want to** validate a company's subscription status before revealing candidate identity  
**So that** only paying companies access candidate details, and the correct fee model applies

**Acceptance Criteria:**
- Subscription tiers: `FREE` (0 reveals) | `PRO` ($X/month, Y reveals) | `ENTERPRISE` (unlimited reveals)
- Pre-reveal check:
  - `PRO` with `revealsRemaining > 0` → Reveal + decrement + log discounted fee (10–12%)
  - `FREE` or quota exhausted → Redirect to Stripe checkout (20–30% contingency)
  - `ENTERPRISE` → Always reveal, no decrement
- Subscription dashboard for companies: tier, reveals used/remaining, billing cycle, renewal date
- Notification when reveal quota drops to ≤ 3 remaining — in-app alert
- Stripe: subscription created via `POST /api/companies/{id}/subscribe` → Stripe Checkout Session
- Stripe webhook handles: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`

**Components to Create:**
- `CompanySubscriptionDashboardComponent` (`company/components/subscription-dashboard/`) — tier badge, reveals used/remaining progress bar, billing info, upgrade CTA
- `SubscriptionUpgradeModalComponent` (`company/components/subscription-upgrade-modal/`) — tier comparison table, Stripe checkout redirect
- `RevealQuotaIndicatorComponent` (`company/components/reveal-quota-indicator/`) — compact remaining-reveals badge in company header

**Backend changes required:**
- New entity: `CompanySubscription (id, companyId, tier, revealsRemaining, billingCycle, subscriptionStart, subscriptionEnd, stripeSubscriptionId, stripeCustomerId)`
- Flyway migration: `V15__Add_Company_Subscriptions.sql`
- `ISubscriptionService` + `SubscriptionServiceImpl` — validate tier, decrement quota, apply fee model
- `POST /api/companies/{id}/subscribe` — initiate Stripe Checkout Session, return `checkoutUrl`
- `GET /api/companies/{id}/subscription` — current subscription details
- `PATCH /api/companies/{id}/subscription/cancel` — cancel (end of billing period)
- `POST /api/webhooks/stripe` — handle Stripe events (shared handler with US 1.8)

**Data Model:**
```typescript
CompanySubscription {
  id: string
  companyId: string
  tier: SubscriptionTier            // FREE | PRO | ENTERPRISE
  revealsRemaining: number | null   // null = unlimited (ENTERPRISE)
  billingCycle: BillingCycle        // MONTHLY | ANNUAL
  subscriptionStart: Date
  subscriptionEnd: Date
  stripeSubscriptionId: string
  stripeCustomerId: string
}
```

**Dependencies:** Stripe account configured, `COMPANY` Keycloak role exists (US 1.8)

---

### Epic: Compliance & Audit *(Post-Launch)*

#### US 1.10: System Logs All Identity Reveals for Audit & Compliance

**As a** platform administrator  
**I want to** audit all identity reveals and placement transactions  
**So that** we can enforce Terms of Service, track revenue, and investigate disputes

**Acceptance Criteria:**
- Every reveal logged with: company, candidate, timestamp, pathway, fee
- `RevealAuditLog` written atomically (US 1.8 pre-condition — already enforced)
- Track off-platform hire violations: candidate reports when hired outside the platform
- Admin reports: reveals per month, revenue by pathway, subscription vs contingency split
- Terms of Service acceptance required before first reveal (company portal)
- Penalty system for off-platform violations (account suspension — future)

**Components to Create (Admin):**
- `AuditDashboardComponent` (`admin/audit-dashboard/`) — reveals log, filterable by company/candidate/date
- `RevenueAnalyticsComponent` (`admin/revenue-analytics/`) — monthly revenue, pathway split, subscription vs contingency breakdown
- `ComplianceReportComponent` (`admin/compliance-report/`) — ToS acceptance status, violations log

**Backend changes required:**
- `GET /api/admin/audit/reveals` — paginated reveal log
- `GET /api/admin/audit/revenue` — revenue analytics by period
- `POST /api/candidates/me/violations` — candidate reports an off-platform hire
- Scheduled report job: monthly revenue summary email to platform operator

**Dependencies:** US 1.8 (reveal audit log exists), US 1.9 (subscription records exist)

---

#### US 1.8a: Candidate Can Approve or Reject a Reveal Request *(Future)*

**As a** candidate  
**I want to** approve or reject a company's request to reveal my identity  
**So that** I have final control over who accesses my real information

**Note:** The `RevealRequestModalComponent` is scaffolded in US 1.8. This story activates the approval flow — until then, reveals are auto-approved once payment is confirmed.

**Acceptance Criteria:**
- Candidate receives notification: *"Company X wants to reveal your identity. Approve or decline."*
- 48-hour response window — auto-approves if no response (configurable by admin)
- Declining blocks this company from requesting another reveal for 90 days
- Approval transitions reveal status from `PENDING_CANDIDATE_APPROVAL` → `PENDING_PAYMENT`
- Reveal audit log records candidate approval timestamp

**Dependencies:** US 1.8 (reveal workflow), US 1.9 (payment flow)

---

## New File Structure (Monetization)

```
src/app/functional-features/recruitment/
├── candidate/
│   └── components/
│       └── reveal-requests/
│           ├── reveal-request-list/                # US 1.8 — candidate sees who requested reveal
│           └── reveal-request-modal/               # US 1.8a scaffold — approval flow
│
└── company/                                        # NEW — Monetization phase
    ├── components/
    │   ├── identity-reveal-button/                 # US 1.8
    │   ├── subscription-dashboard/                 # US 1.9
    │   ├── subscription-upgrade-modal/             # US 1.9
    │   └── reveal-quota-indicator/                 # US 1.9
    └── services/
        ├── reveal.service.ts                       # US 1.8
        └── subscription.service.ts                 # US 1.9

src/app/functional-features/admin/
└── components/
    ├── audit-dashboard/                            # US 1.10
    ├── revenue-analytics/                          # US 1.10
    └── compliance-report/                          # US 1.10
```

---

## Flyway Migrations (Monetization)

| Migration | Description | Story |
|-----------|-------------|-------|
| `V14__Add_Reveal_Tables.sql` | `identity_reveal_requests`, `reveal_audit_logs` | US 1.8 |
| `V15__Add_Company_Subscriptions.sql` | `company_subscriptions` table | US 1.9 |

---

## Story Summary

| Story | Focus | Dependencies | Estimated Effort |
|-------|-------|--------------|-----------------|
| **US 1.9** | Subscription validation + Stripe integration | Stripe configured, COMPANY role | 2 sprints |
| **US 1.8** | Identity Reveal workflow + Company portal | US 1.9, US 1.3a, US 1.5 | 2 sprints |
| **US 1.10** | Audit logging + Revenue analytics + Compliance | US 1.8, US 1.9 | 1.5 sprints |
| **US 1.8a** | Candidate approval / rejection of reveal | US 1.8 | 0.5 sprint |

> Build US 1.9 first — the subscription check must exist before the reveal logic can branch on it.
