# Interactions Intelligence - Phase 2 Production Scale Plan

## 1. Purpose
Define the target architecture and delivery plan for scaling Interactions Intelligence safely into INT and production.

This document is the implementation blueprint after Phase 1 stabilization.

## 2. Target Outcomes
- Candidate intelligence remains actionable, explainable, and stable at high volume.
- Admin testing workflows remain available only where intended by policy.
- Feature controls are runtime-manageable without rebuilds.
- Inference quality and user outcomes are measurable and continuously calibratable.

## 3. Scale Architecture (Best-Standard Target)

## 3.1 Runtime Feature Flag Platform
Current baseline:
- Build-time environment toggles read through FeatureFlagsService.

Production-scale target:
- Runtime flag source (API/config service) loaded at app bootstrap with short-lived cache.
- Flag evaluation service remains the single read path for app code.
- Support role-scoped and segment-scoped evaluations:
  - role (APPLICANT, RECRUITER, MO_ADMIN)
  - environment (LOCAL, INT, PROD)
  - cohort/experiments (optional)

Required capabilities:
- Fail-safe defaults when runtime config unavailable.
- Telemetry for flag fetch failures.
- Exposure logging for critical flags.

## 3.2 Intelligence Decision Engine
Current baseline:
- EventType logic mapped directly in component-level methods.

Production-scale target:
- Dedicated intelligence domain service layer:
  - stage-inference service
  - action-recommendation service
  - risk-detection service
  - narrative-composition service
- Deterministic rules first, ML-assisted ranking optional later.
- Pure functions for testability and replay.

Design requirements:
- Rule priority table versioned and explicit.
- Confidence scoring calibrated from observed outcomes.
- Explainability payload for every recommendation.

## 3.3 Data Model and Contracts
Target contract output per selected thread:
- currentStage
- stageConfidence
- freshnessState
- blockers[]
- recommendedActions[]
- rationale[]
- evidenceEvents[]
- opportunityFacts {
  - roleTitle
  - companyName
  - location
  - workMode (remote/hybrid/office)
  - requiredSkills[]
  - salaryRange
  - visaConstraints
  - noticePeriod
  - interviewDate
  - dealBreakerCount
  }
- computedAt
- modelVersion (or rulesVersion)

Rules:
- Never expose raw internal taxonomy as primary candidate-facing language.
- Keep recruiter agency company separate from actual client company in candidate-facing output.
- Preserve traceability from guidance back to source events for audit/debug.
- Email-derived opportunity facts must be versioned and never inferred from raw preview text alone when structured metadata exists.

## 3.4 Observability and Quality Loop
Must capture:
- Flag exposures and route-level access decisions.
- Stage transitions over time.
- Recommendation acceptance rate.
- User action completion after recommendation.
- False-positive/false-negative review outcomes.

Operational dashboards:
- intelligence correctness drift
- blocked-flow hotspots (compensation/location/process)
- stale-opportunity backlog

## 3.5 Performance and Reliability
Targets:
- Candidate panel first meaningful render <= 1.5s on normal network.
- Intelligence recompute for single thread <= 100ms in client path.
- Rule engine execution deterministic and side-effect free.

Approach:
- Cache derived intelligence per thread with invalidation on new events.
- Progressive rendering: snapshot first, detailed rationale second.
- Graceful fallback UI when intelligence payload fails.

## 4. Access and Governance Model
- Candidate/Recruiter interactions access remains available across environments unless explicitly toggled.
- Admin interactions access controlled by policy flags and role-scoped guards.
- Navigation visibility must always mirror route guard outcomes.
- Any policy change requires docs update plus test update.

## 5. Delivery Plan

## 5.1 Phase 2A - Architecture Hardening
- Introduce runtime-config capable FeatureFlagsService abstraction.
- Implement intelligence domain services and move logic out of UI components.
- Add typed intelligence response models.

Exit criteria:
- No direct environment feature checks outside flag service.
- Rule-engine unit coverage >= 90% for critical stage/risk logic.

## 5.2 Phase 2B - Calibration and Telemetry
- Add recommendation outcome telemetry.
- Add confidence calibration pipeline and thresholds.
- Add dashboards for recommendation effectiveness and drift.

Exit criteria:
- Confidence bands calibrated against observed outcomes.
- Weekly signal quality report available.

## 5.3 Phase 2C - Controlled Rollout
- Enable runtime flag targeting by role/cohort.
- Progressive rollout with rollback controls.
- Run A/B or staged rollout for candidate guidance variants.

Exit criteria:
- Rollback under 5 minutes via config only.
- No critical regressions during staged rollout windows.

## 6. Testing Strategy at Scale

## 6.1 Rule Engine Tests
- Event-sequence fixtures for all EventType categories.
- Conflict resolution tests for competing signals.
- Regression snapshots for narrative outputs.

## 6.2 Guard and Access Tests
- Role x environment matrix tests for interactions access.
- Navigation visibility parity tests.

## 6.3 E2E and Contract Tests
- Candidate middle-panel rendering from mocked intelligence payload.
- Backward-compatible contract tests for intelligence schema versions.

## 7. Security and Compliance
- No sensitive personal data in telemetry payloads.
- Redact free-text message content from analytics events.
- Keep explainability evidence IDs, not raw message bodies, in logs.

## 8. Pre-Production Go/No-Go Checklist
- Runtime flag source operational in INT.
- Access matrix validated for APPLICANT/RECRUITER/MO_ADMIN.
- Intelligence service latency and error-rate SLOs met.
- Monitoring and alerting active.
- Rollback playbook tested.
- Documentation and runbooks updated.

## 9. Decision Standards (Final)
- Keep Phase 1 deterministic rule-first design as core.
- Add runtime flags before production cutover.
- Keep role-scoped guards as enforcement path.
- Promote only after telemetry-backed calibration.

## 10. Ownership
Primary owners:
- Frontend platform: Feature flags, routing guards, UI integration.
- Intelligence domain: Stage/risk/action engine and calibration.
- Product/UX: Guidance language quality and action clarity.
- DevOps/SRE: Runtime config reliability, observability, and rollout safety.
