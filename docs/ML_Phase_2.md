# ML Phase 2: Inhouse Model Side-by-Side

## Purpose

This document defines the second ML phase for More: the homegrown model that runs side by side with Llama until it proves it is stronger and stable enough to take over.

The ML implementation must remain in a separate top-level code package such as `ml`. The outreach package must not contain model logic.

## Context

**Phase 2 Theme: Inhouse Model Readiness & Controlled Promotion**

Phase 2 turns the Llama baseline into a side-by-side evaluation target and introduces the inhouse model as a production contender. The objective is not to replace Llama early, but to prove that the inhouse model can match or exceed it under controlled, measurable conditions.

This phase focuses on:
- shadow-mode comparison against Llama
- confidence-based routing and review
- repeatable training and benchmark reporting
- rollback readiness if the inhouse model regresses
- a clear promotion path before any retirement of Llama

## Phase Dependencies

**Prerequisites from Phase 1:**
- a stable ML package boundary exists
- Llama input/output contracts are already validated
- disagreement and review data are being captured
- the rule-based baseline remains available for comparison where needed

**What Phase 2 adds:**
- the inhouse model implementation
- side-by-side model evaluation
- batch retraining from approved labels
- promotion and rollback criteria
- Llama retirement decision gates

## Migration Note

Phase 2 does not replace the Phase 1 contract. It extends it. The inhouse model must accept the same input shape, emit the same core structured fields, and preserve the same confidence and review behavior so routing can switch between models without changing the rest of the system.

## Privacy And Ingestion Policy

- The inhouse model must operate on structured, minimal records, not raw email bodies.
- Default ingestion remains a 6-month lookback window for mailbox scanning; older historical records require explicit recruiter email or domain targeting.
- All stored output must be paraphrased and normalized, with timestamps preserved for traceability.
- Raw email body text should remain transient and should never be the persisted record of the interaction.
- User-controlled allowlists, opt-in scanning, and revocation remain required governance controls.
- The production path should always prefer metadata-first filtering and low-retention classification before deeper parsing.

## Implementation Order

| Step | Focus |
|------|-------|
| 1 | Reuse the Phase 1 input contract for the inhouse model |
| 2 | Enforce strict JSON output and confidence scoring |
| 3 | Run shadow-mode comparisons against Llama |
| 4 | Capture disagreements in a review queue |
| 5 | Add benchmark reports and promotion criteria |
| 6 | Define rollback and retirement rules for Llama |

## Phase Goal

Build and validate an inhouse model that can compete with Llama on our recruitment and interactions use cases.

The inhouse model should eventually become the primary production model only after it consistently beats Llama on the agreed metrics.

## Phase Strategy

### Side-by-Side Mode

- Run the inhouse model and Llama against the same inputs.
- Compare outputs in shadow mode before promoting the inhouse model.
- Keep Llama available as fallback until the inhouse model is clearly better.
- Use human review for disagreement cases and low-confidence predictions.

### Promotion Rule

- Do not retire Llama until the inhouse model wins on accuracy, latency, and operational stability.
- Promote only when the evaluation benchmarks prove the result is repeatable.

## Phase 2 Scope

- Inhouse model consumes the same structured inputs as Llama.
- Inhouse model returns strict JSON and confidence scores.
- Inhouse model lives in a separate ML package.
- Training uses approved production labels.
- Shadow-mode comparisons are captured and reviewed.
- Benchmark reports and promotion checks are produced for each release.
- Cutover, rollback, and retirement rules are defined for Llama.
- Admins can add event labels from the UI without a code change or deployment.

| Scope item | User story |
|------------|------------|
| Inhouse model consumes the same structured inputs as Llama | US-ML11: Inhouse Model Consumes The Same Structured Inputs As Llama |
| Inhouse model returns strict JSON and confidence scores | US-ML12: Inhouse Model Returns Strict JSON; US-ML15: Inhouse Model Captures Confidence Scores |
| Inhouse model lives in a separate ML package | US-ML13: Inhouse Model Runs In A Separate ML Package |
| Training uses approved production labels | US-ML14: Training Uses Approved Production Labels |
| Shadow-mode comparisons are captured and reviewed | US-ML16: Inhouse Model And Llama Run In Shadow Mode; US-ML17: Disagreement Cases Are Stored In A Review Queue |
| Benchmark reports and promotion checks are produced for each release | US-ML18: Benchmark Reports Exist For Each Release; US-ML19: Routing Uses Confidence Thresholds; US-ML20: Clear Promotion Checklist Exists Before Cutover |
| Cutover, rollback, and retirement rules are defined for Llama | US-ML21: Cutover Criteria Are Defined Before Retirement; US-ML22: Rollback Path Exists Back To Llama; US-ML23: Latency And Error Rate Are Tracked For Both Models; US-ML24: Training Pipeline Is Repeatable; US-ML25: Llama Remains Fallback Until Confidence Is High |
| Admins can add event labels from the UI without a code change or deployment | US-ML26: New Event Labels Need No Code Change |

## User Stories

### Epic: Inhouse Model Build

#### US-ML11: Inhouse Model Consumes The Same Structured Inputs As Llama

**As a** developer  
**I want to** feed the inhouse model the same structured inputs as Llama  
**So that** both models can be compared fairly

**Acceptance Criteria:**
- Both models accept the same canonical input structure
- Input normalization happens before model invocation
- Comparison results can be stored for later analysis

#### US-ML12: Inhouse Model Returns Strict JSON

**As a** developer  
**I want to** make the inhouse model return strict JSON responses  
**So that** the backend can validate results reliably

**Acceptance Criteria:**
- Response schema is defined and enforced
- Invalid JSON is rejected or retried
- The backend can parse the result without manual cleanup

#### US-ML13: Inhouse Model Runs In A Separate ML Package

**As a** developer  
**I want to** run the inhouse model in a separate `ml` package  
**So that** model concerns stay isolated from outreach

**Acceptance Criteria:**
- No model logic lives inside outreach code
- ML services are reachable through interfaces or adapters
- Package boundaries are enforced by design

#### US-ML14: Training Uses Approved Production Labels

**As a** data owner  
**I want to** feed retraining with approved production labels  
**So that** the model learns from real domain data

**Acceptance Criteria:**
- Approved labels are versioned
- Rejected or uncertain labels are excluded
- Training datasets can be reproduced later

#### US-ML15: Inhouse Model Captures Confidence Scores

**As a** product owner  
**I want to** capture confidence scores from the inhouse model  
**So that** low-confidence predictions can be routed for review

**Acceptance Criteria:**
- Each prediction includes a confidence score
- Confidence thresholds are configurable
- Low-confidence output can be diverted to review or fallback

### Epic: Side-by-Side Evaluation

#### US-ML16: Inhouse Model And Llama Run In Shadow Mode

**As a** developer  
**I want to** run the inhouse model and Llama in shadow mode together  
**So that** I can compare their outputs safely

**Acceptance Criteria:**
- Both models can process the same input
- Shadow results are recorded without affecting production behavior
- Disagreements are easy to inspect

#### US-ML17: Disagreement Cases Are Stored In A Review Queue

**As a** developer  
**I want to** store disagreement cases in a review queue  
**So that** false positives and false negatives can be inspected later

**Acceptance Criteria:**
- Disagreement records include both outputs
- Review queue can be filtered and replayed
- Reviewed items can be promoted into training data

#### US-ML18: Benchmark Reports Exist For Each Release

**As a** product owner  
**I want to** review benchmark reports for each release  
**So that** I can verify the inhouse model is improving over time

**Acceptance Criteria:**
- Each release has a benchmark result set
- Reports include key quality metrics and regressions
- Historical performance is retained for comparison

#### US-ML19: Routing Uses Confidence Thresholds

**As an** operator  
**I want to** route predictions using confidence thresholds  
**So that** the production path remains stable

**Acceptance Criteria:**
- High-confidence predictions can be auto-accepted
- Medium/low confidence predictions can be reviewed or fallback to Llama
- Routing logic is configurable without code changes

#### US-ML20: Clear Promotion Checklist Exists Before Cutover

**As a** stakeholder  
**I want to** have a clear promotion checklist  
**So that** the inhouse model only replaces Llama after it proves itself

**Acceptance Criteria:**
- Promotion criteria are documented
- Promotion requires benchmark and operational checks
- Llama stays available until promotion succeeds

### Epic: Retiring Llama

#### US-ML21: Cutover Criteria Are Defined Before Retirement

**As a** product owner  
**I want to** define cutover criteria before replacement  
**So that** Llama is only retired when the inhouse model is ready

**Acceptance Criteria:**
- Retirement criteria are documented in advance
- Cutover requires repeated success, not a single run
- Criteria are measurable and reviewed with the team

#### US-ML22: Rollback Path Exists Back To Llama

**As a** developer  
**I want to** keep a rollback path back to Llama  
**So that** a release can be reversed safely if the inhouse model regresses

**Acceptance Criteria:**
- Llama can be re-enabled without code surgery
- Rollback is part of the release process
- A failed promotion does not block the system

#### US-ML23: Latency And Error Rate Are Tracked For Both Models

**As an** operator  
**I want to** track latency and error rate for both models  
**So that** I can verify production readiness

**Acceptance Criteria:**
- Both models expose runtime metrics
- Latency and error budgets are monitored
- Operational regressions block promotion

#### US-ML24: Training Pipeline Is Repeatable

**As a** data scientist  
**I want to** keep the model training pipeline repeatable  
**So that** retraining does not introduce uncontrolled drift

**Acceptance Criteria:**
- Training runs are versioned
- The same dataset and config can reproduce a run
- Changes in data or config are traceable

#### US-ML25: Llama Remains Fallback Until Confidence Is High

**As a** stakeholder  
**I want to** keep Llama as fallback until confidence is high  
**So that** business quality does not drop during the transition

**Acceptance Criteria:**
- Llama remains available until thresholds are met
- Fallback can be enabled per route or per use case
- Retirement only happens when the inhouse model is consistently stronger

### Epic: Taxonomy Without Deployments

#### US-ML26: New Event Labels Need No Code Change

Status: Proposed. The approach (Option B or Option C below) is decided at implementation time.

**As an** admin  
**I want to** add a new event label in the prompt settings and have it work end to end  
**So that** extending the taxonomy never needs a developer or a deployment

**Background:**
US-ML11 (Phase 1) made the prompt and label list admin-managed master data. A label still has to match a constant of the Java enum `InteractionEventType`, because that enum is the stored event type and the rules in `EmailProcessorTransactional` and the frontend `EventType` refer to its constants. Today the admin UI warns (draft: "Needs code change" badge and banner on the Labels tab; publish: validation error naming `InteractionEventType`) and a developer adds the constant. This story removes that step.

**Options (choose one when this story is picked up):**

| | Option B: Fully data-driven | Option C: Hybrid |
|---|---|---|
| Stored event type | String that references `ml_event_label.name`; the enum is removed | Enum kept for labels the code reasons about; any other label is stored as a plain string |
| Behaviour per label | Moves to columns on `ml_event_label` (UI group, display name, colour, stage effect, bottleneck / needs-met pairing, review rules) | Only the enum labels keep their coded behaviour; other labels are generic: shown with the admin's display name in a neutral group, with no stage logic |
| Developer needed for a new label | Never | Only when the label needs special behaviour |
| Effort | Large: entity and converter, DTOs, analytics maps, processor rules, frontend `EventType`, grouping and colours, data migration of stored values | Medium: persistence and DTO type change from enum to string-backed value; rules stay as they are |
| Main risk | Behavioural rules in code (INTEREST_CHECK handling, CV_REQUEST fallbacks, thread inference) must be re-expressed as data | Two kinds of label to explain to admins; generic labels cannot drive timeline or stage behaviour |

**Acceptance Criteria:**
- A label added and published in the admin UI is accepted from the model, stored on the event, returned by the API and shown in the frontend without a code change or deployment
- Publishing no longer fails with "has no matching event type in the application; a new label needs a code change"
- Existing stored events keep their type values; a migration (if needed) is reversible and tested
- Labels that keep coded behaviour are clearly identified to the admin, with the behaviour each one triggers
- The frontend renders labels it has no special handling for, using the display name and group from master data
- The chosen option and the reasons for it are recorded in this document before implementation starts
- Tests cover storing, reading, filtering and analytics for a label that has no enum constant
- The "Needs code change" feedback from US-ML11 is removed or limited to the labels that still need code

## Operating Principles

- Keep the inhouse model and Llama side by side during Phase 2.
- Prefer the inhouse model only when it meets or exceeds the acceptance thresholds.
- Keep human oversight for uncertain or high-impact outputs.
- Use batch retraining, not uncontrolled live training.
- Preserve a frozen benchmark set so model progress can be measured honestly.

## Data and Model Lifecycle

- Data queues: store inputs, model outputs, accepted labels, and disagreement examples.
- Confidence thresholds: route uncertain predictions to review or fallback.
- Retraining cadence: retrain in controlled batches on approved data.
- Promotion checklist: evaluate quality, latency, and safety before promotion.
- Cutover criteria: retire Llama only when the inhouse model is consistently stronger.

## Success Criteria

Phase 2 is successful when:
- the inhouse model is measurable against Llama
- the inhouse model consistently matches or exceeds target metrics
- the backend can route to the inhouse model safely
- Llama can be reduced to fallback or retired entirely
- the ML package remains separated from outreach code
