# ML Phase 1: Llama First, Inhouse Later

## Purpose

This document defines the initial ML strategy for the More project.

The ML work must live in a dedicated ML package and not inside the outreach package. The outreach package is responsible for business workflows, while the ML package is responsible for model training, inference, evaluation, and model lifecycle concerns.

## Context

**Phase 1 Theme: Llama-First Validation & ML Boundary Setup**

Phase 1 proves the AI-assisted interactions flow with Llama before the inhouse model exists. The goal is to validate model input/output contracts, confidence handling, and review flows while keeping the ML implementation separate from outreach.

Gmail will be used as the first implementation and validation provider, but the architecture must be designed as a pluggable inbound-email strategy so other mail providers can be added later without changing the ML contract or outreach workflow.

This phase establishes the foundation that Phase 2 will build on:
- a separate ML package boundary
- strict structured output
- deterministic comparison against the current rule-based parser
- a review queue for uncertain predictions
- local developer execution with Llama
- an inbound-source abstraction that works beyond Gmail

## Phase Dependencies

**Prerequisites for this phase:**
- Outreach parsing and interaction workflows remain intact
- Rule-based parsing continues as the baseline comparator
- ML code is implemented outside outreach
- Gmail is the first provider used to validate the flow, but the design remains source-agnostic

**What Phase 1 unlocks:**
- Llama output capture and validation
- a stable input/output contract for model work
- labeled disagreement data for the inhouse model phase
- a production-grade path for human review and fallback
- a reusable inbound-email adapter strategy for other providers later

## Migration Note

The output of Phase 1 becomes the contract for Phase 2. If the Phase 1 structured response changes, the inhouse model work must stay aligned with the same schema and confidence semantics so the evaluation path remains comparable.

## Progress Snapshot

Status as of the current phase checkpoint:

- Completed: ML boundary is separated from outreach and sits in its own package
- Completed: Gmail inbound adapter and normalized inbound email contract are in place
- Completed: Llama-based classification service is implemented with deterministic fallback behavior; Ollama 0.35.1 with `llama3.1` is now installed on the dev machine and one sample recruiter email has been run through it (valid JSON, ~12s on CPU)
- Completed: outreach intake consumes the ML result contract instead of embedding source-specific logic
- Completed: structured extraction regression for company and job title has been fixed and validated (against the deterministic fallback only; not yet validated against live Llama output)
- Completed: confidence scores are produced and low-confidence outputs are routed to manual review instead of auto-processing
- Completed: multi-intent emails are supported. The classifier returns a primary `eventType` plus `additionalEventTypes` (e.g. `CV_REQUEST` + `INTERVIEW_INVITE`); the values are persisted on the audit and review queue tables (Flyway `V20261003_200000__add_ml_additional_event_types.sql`, comma-separated column) and the outreach flow creates one `InteractionEvent` per valid, distinct additional type (unknown values are ignored). The single deduplication fingerprint stays attached to the primary event
- Open finding: live `llama3.1` does not reliably follow the prompt's priority rule (`CV_REQUEST, INTERVIEW_INVITE, FOLLOW_UP, REPLY, OUTREACH`); for a CV + call request email it returned `OUTREACH` with only `CV_REQUEST` additional. Next step is to enforce the priority order in code and measure on a labelled sample
- Completed: a review queue service captures pending low-confidence classification items for manual review
- Completed: structured ML audit logging records classification decisions and confidence signals for later review
- Completed: admin ML monitoring endpoints expose evaluation summaries, pending review items, and the recent audit feed
- Completed: the admin dashboard surfaces performance cards, manual review queue actions, recent audit feed, and dataset export controls for trust and governance
- In progress: Phase 2 model comparison and inhouse retraining handoff
- Completed: simplified sync flow (fetch -> normalise -> dedupe -> Llama -> create interaction or reject). The legacy parser, review queue, audit, sent-mail and auto-enrich steps are commented out. Gmail is queried inbox-only, excluding Promotions/Social/Forums, up to 500 messages per run, and after a clean run only mail newer than `user_email_settings.last_scan_completed_at` is fetched (Flyway `V20261004_170000`)
- Completed: Llama decides `recruiterRelevant` (fail-closed). A sender Llama rejected is skipped for the rest of the same sync run (in-memory, garbage collected afterwards; nothing stored)
- Completed: interaction persistence is fire-and-forget. Classification runs outside any transaction; each accepted email is saved by a single-thread executor created per sync run, and the sync waits for those saves before deciding the scan watermark so a failed save does not advance it
- Completed: one `InteractionEvent` per email (the earlier one-row-per-additional-intent behaviour is replaced; extra intents are recorded in the event notes as `Also: ...`). Events now store `thread_id`, `gmail_message_id`, `subject` and `message_body` (Flyway `V20261004_190000`)
- Completed: `GET /api/interactions/{interactionId}/threads/{threadId}` reads the full Gmail thread live (recruiter messages and the candidate's replies, not stored) and the interactions page shows it in a PrimeNG timeline
- Completed: live timeline safety hardening under `US-ML10` now treats unsynced thread messages as provisional (`PENDING_CLASSIFICATION`) until sync persists the final `eventType` and `additionalEventTypes`; the UI displays this provisional state as "Queued for classification"
- Completed: thread-first sync. The inbox scan finds the seed messages (oldest first, so an opening email creates its thread before its replies are judged). A second pass (`TrackedThreadMessageFetcher`) then downloads every Gmail thread that already owns an interaction (including threads created in the same run), drops the messages already stored, and sends the rest through the same pipeline in oldest-first order. This is how the user's own replies and later answers from the recruiter or a colleague are ingested, with no separate `in:sent` search, search window or result cap. Threads with no stored event are never fetched. A thread that no longer exists in Gmail is skipped; any other fetch failure is reported in the sync errors and retried on the next sync. Sent mail never creates an interaction: if no interaction owns the thread it is dropped. Messages are stored with `sent_by_user = true` for the user's own mail (Flyway `V20261007_090000`), which the UI uses for direction. Messages not stored yet use internal marker `PENDING_CLASSIFICATION` and are shown as "Queued for classification" in the timeline; unresolved provisional cases are shown as "Not Classified". The old read-time keyword labels are removed
- Completed: inside a tracked thread the model also receives the previous message of the thread (what it labelled and who wrote it) and an "Author: the CANDIDATE" line for the user's own mail, so a short confirmation is read as an answer (`ACKNOWLEDGEMENT`) and not as a new request
- Policy: the classifier prompt currently has no few-shot examples. Any example added later must be invented, never copied or paraphrased from a real mailbox, and evaluation must use a labelled set that was not used to write prompts or rules
- Completed: messages in a thread that is already tracked are trusted as part of the conversation: they skip the "recruiter relevant" and keyword gates and never blacklist the sender, so short follow-ups are no longer rejected. A sanity-check failure no longer blacklists the sender either
- Completed: new categories `INTEREST_CHECK` (they ask whether you are interested) and `ACKNOWLEDGEMENT` (receipt confirmed, e.g. "thanks for sending your CV"). `REPLY` is no longer offered to the model (legacy rows keep it); the fallback in a known thread is `FOLLOW_UP` for inbound mail and `ACKNOWLEDGEMENT` for the user's own mail
- Completed: code-side label checks after the model answers: `CV_REQUEST` needs a CV/resume mention in the newest message (quoted history is ignored); inbound mail cannot be `INTERESTED`/`NOT_INTERESTED` (mapped to `INTEREST_CHECK`/`REJECTION`); an interest question phrase adds `INTEREST_CHECK`; the user's own mail cannot be `INTEREST_CHECK`
- Completed: job spec categories are `JOB_SPEC_TO_BE_SENT` (recruiter will send the spec if needed; not in the email) and `JOB_SPEC_ATTACHED` (spec already sent, attached or written out). They replace `JOB_SPEC_OFFERED`/`JOB_SPEC_SHARED`, whose names the model treated as synonyms; Flyway `V20261006_160000` migrates stored values. Interest semantics are stricter so recruiter prompts like "if you're interested" are not labelled as candidate interest
- Completed: recruiter-company base seeding is fire-and-forget. For recruiter-relevant emails, sender domains are processed asynchronously and passed through `CompanyService` normalization/creation rules to grow the company base without blocking sync
- Completed: `EMAIL_DOMAIN` scan strategy skeleton is active for new user defaults. It first queries Gmail using known recruiter-company domains, then fills remaining slots with the baseline inbox query
- Completed: `SPECIFIC_EMAIL_ADDRESS` scan strategy is implemented as a selectable first-class option for focused testing. The user can configure one or more sender email addresses from the frontend settings, and the strategy applies the same inbox/category/date watermark rules as other strategies
- Policy change to confirm: full body text of recruiter-relevant emails is now stored on the event so it can feed inhouse model training; rejected emails are never stored. This supersedes the "no original email body" line in the policy below

The work is now split into two clear streams:
1. Core ML extraction boundary (done and validated)
2. Confidence, review, audit, and admin monitoring layer (execution gating, queueing, audit logging, and operational visibility are live; Phase 2 model comparison remains the follow-on work)

## Privacy And Ingestion Policy

- Default lookback window: the system scans only the last 6 months of mailbox activity unless the user explicitly provides a recruiter email address or domain.
- Older emails are not scanned by default; they require a targeted search for a known recruiter or company sender.
- Raw email content is never treated as the durable record. The system stores only safe, structured metadata and a paraphrased summary of the email intent.
- Persisted fields should include sender, company, recruiter intent, timestamps, confidence score, and a paraphrased summary, not the original email body.
- User consent is required before inbox scanning begins, and the user must be able to disable or revoke access at any time.
- A staged ingestion flow should be used: metadata filtering first, recruiter-likelihood classification second, and full parsing only for likely recruiter emails.
- If the system cannot determine that an email is recruiter-related, it should not ingest or retain the message content.
- User-provided recruiter addresses and labels become part of the feedback loop and can improve future classification accuracy without expanding retention.

## Implementation Order

| Step | Focus | Status |
|------|-------|--------|
| 1 | Define the ML package boundary and adapter contract | Completed |
| 2 | Run Llama locally and validate structured output | Completed for one sample (broader sample set still needed) |
| 3 | Compare Llama against the rule-based parser | In progress (first disagreement observed: Llama `OUTREACH` vs fallback `CV_REQUEST` on a CV-request email) |
| 4 | Capture confidence scores and low-confidence review items | Completed |
| 5 | Store disagreement data and audit records for future retraining | In progress |
| 6 | Confirm the Phase 2 handoff data is being collected | Planned |

Note: the low-confidence review queue is now wired into the intake flow and stores pending items for manual triage.

## Architecture Rule

- Do not place ML implementation in the outreach code package.
- Keep outreach focused on interaction tracking and recruiter workflow logic.
- Put ML-specific services, model adapters, training code, evaluation code, and inference orchestration in a separate top-level code package such as `ml`.
- Treat the ML package as the system boundary for all model-related concerns.
- Outreach must consume ML through an interface or adapter, not by embedding model logic directly.
- The first validation provider is Gmail, but inbound email sources must be implemented through a provider-agnostic adapter strategy so other email servers can be added later.

## Phase Strategy

### Phase 1: Llama First

Goal:
- Validate the full AI-assisted flow using Llama before introducing the inhouse model.

Why:
- Llama gives us a production-realistic baseline quickly.
- It lets us prove the user experience, extraction quality, and routing logic before investing in custom training.
- It gives us real labeled behavior to compare against later.

Phase 1 scope:
- Local developer testing with Llama.
- Structured extraction from LinkedIn and recruitment messages.
- Event classification.
- Company and job title extraction.
- Confidence scoring.
- Human review for low-confidence cases.
- Logging and evaluation of model outputs.

| Scope item | User story | Status |
|------------|------------|--------|
| Local developer testing with Llama | US-ML1: Developer Can Run Llama Locally | In progress |
| Structured extraction from Gmail and other inbound recruitment messages | US-ML2: Model Extracts Structured Recruitment Fields | In progress |
| Event classification | US-ML3: Model Classifies Events | In progress |
| Company and job title extraction | US-ML4: Model Extracts Company And Job Title | In progress |
| Confidence scoring | US-ML5: Model Produces Confidence Scores | In progress |
| Human review for low-confidence cases | US-ML6: Low-Confidence Output Is Flagged For Review | Completed |
| Logging and evaluation of model outputs | US-ML7: Model Outputs Are Logged And Evaluated | Completed |
| Sync-safe live timeline classification | US-ML10: Live Messages Are Marked Pending Until Sync Classification | Completed |

Note: classification audit logging and evaluation summaries are now active in the ML layer for operational review and Phase 2 handoff preparation.


## User Stories

### Epic: Llama First Validation

#### US-ML1: Developer Can Run Llama Locally

Status: In progress (Ollama 0.35.1 and `llama3.1` installed; one sample message returned schema-valid JSON in ~12s on CPU with no GPU offload. Remaining: run a broader sample set and compare against the rule-based parser. The service has no HTTP request timeout, which needs addressing before relying on it in intake)

**As a** developer  
**I want to** run Llama locally  
**So that** I can test the AI flow without waiting for production infrastructure

**Notes:**
- Gmail is the first provider used to validate the flow.
- The implementation must be built with a provider-agnostic inbound-email strategy so other mailbox providers can be added later.

**Acceptance Criteria:**
- Llama can be started in a local dev environment
- A sample message can be sent through the model and returns structured output
- The response can be compared against the current rule-based parser
- The adapter contract is designed to accept more than one inbound email provider

#### US-ML2: Model Extracts Structured Recruitment Fields

Status: In progress (implemented and tested against the deterministic fallback and one live Llama sample; not yet validated across a broader live sample set)

**As a** recruiter user  
**I want to** receive structured extraction from inbound recruitment messages  
**So that** the model returns consistent fields for downstream processing

**Acceptance Criteria:**
- Gmail and other inbound recruitment messages produce structured extraction output
- Core fields such as company, job title, and event type are returned in a predictable shape
- Extraction output can be consumed by the rest of the interactions flow without manual cleanup
- The normalized contract is independent of the source provider

#### US-ML3: Model Classifies Events

Status: In progress (multi-intent output is implemented, but live `llama3.1` ignored the priority rule on the one multi-intent sample tested; consistency across repeated inputs and a labelled comparison are still outstanding)

**As a** recruiter user  
**I want to** classify interaction events automatically  
**So that** replies, interview invites, CV requests, and outreach are handled consistently

**Acceptance Criteria:**
- The model returns a clear event classification for supported interaction types
- Event classification is consistent across repeated inputs
- Uncertain classifications are flagged rather than forced into the wrong category

#### US-ML4: Model Extracts Company And Job Title

Status: In progress (validated against the deterministic fallback; live Llama extraction checked on one sample only)

**As a** recruiter user  
**I want to** extract the company name and job title from the message  
**So that** the interaction can be attached to the correct employer and role

**Acceptance Criteria:**
- Company extraction works for LinkedIn and direct recruiter messages
- Job title extraction works when the title is present in the message
- Missing company or job title values are left blank rather than guessed

#### US-ML5: Model Produces Confidence Scores

Status: In progress (scores are produced and gate review routing, but live Llama self-reported confidence has not been calibrated against labelled data)

**As a** product owner  
**I want to** score model confidence for each prediction  
**So that** low-trust outputs can be handled safely

**Acceptance Criteria:**
- Every prediction includes a confidence score
- Confidence scoring is available for extraction and classification outputs
- Confidence values can be used by downstream review logic

#### US-ML6: Low-Confidence Output Is Flagged For Review

Status: Completed

**As an** admin  
**I want to** review low-confidence outputs before they are accepted  
**So that** incorrect automation does not affect production data

**Acceptance Criteria:**
- Low-confidence results do not auto-apply without review
- Reviewable items are stored separately from accepted labels
- The review queue can be used later for retraining

#### US-ML7: Model Outputs Are Logged And Evaluated

Status: Completed

**As a** developer  
**I want to** log and evaluate model outputs  
**So that** we can compare results over time and prepare the next phase

**Acceptance Criteria:**
- Prediction and review events are logged for later analysis
- Evaluation results can be reviewed over time
- Disagreement cases are stored for future retraining and Phase 2 handoff

#### US-ML8: Label-Based Mailbox Scanning Strategy

Status: Pending

**As a** recruiter user  
**I want to** scan only messages from a configured mailbox label  
**So that** I can limit ingestion to known recruitment folders

**Acceptance Criteria:**
- A scan strategy can be set to label-based selection
- A label name can be saved in user settings
- The sync pipeline uses only messages matching the configured label when this strategy is implemented

#### US-ML9: Sender-Targeted Mailbox Scanning Strategies

Status: Pending

**As a** recruiter user  
**I want to** scan messages by specific sender email or sender domain  
**So that** I can target ingestion to known recruiter sources

**Acceptance Criteria:**
- A scan strategy can be set to specific sender email or sender domain
- Sender email/domain values can be saved in user settings
- The sync pipeline uses only messages matching the selected sender criteria when these strategies are implemented

#### US-ML10: Live Messages Are Marked Pending Until Sync Classification

Status: In progress

**As a** recruiter user  
**I want to** see new Gmail thread messages immediately but marked as pending until sync persists classification  
**So that** automation and UI decisions are not made from unsafe fallback labels

**Acceptance Criteria:**
- Live thread messages that are not yet persisted by the sync workflow carry internal marker `PENDING_CLASSIFICATION` and are shown as "Queued for classification"
- The timeline distinguishes persisted classifications from provisional live messages
- Synthetic fallback labels (for example forcing `REPLY` or `OUTREACH`) are not used for unsynced messages
- Automation that depends on intent labels runs only on persisted sync classifications, not provisional live labels
- Once sync persists the message classification, the provisional label is replaced by the persisted `eventType` and `additionalEventTypes`; unresolved provisional cases in the thread view are shown as "Not Classified"

#### US-ML11: Canonical Event Taxonomy Is Managed As Master Data

Status: Proposed

**As a** product owner or admin  
**I want to** define the allowed ML event labels in application settings and store them as master data  
**So that** the prompt, validation rules, and downstream parsing logic all derive from the same source of truth and do not drift as labels evolve

**Notes:**
- The canonical labels must be owned by the application, not copied into multiple hard-coded `Set.of(...)` lists or scattered `if/else` compatibility blocks.
- Admin-defined labels should include the canonical event name, optional legacy aliases, and any UI-facing display text needed for settings and debugging.
- The runtime should load the master taxonomy once at startup into an application-scoped catalog, then share it with the prompt builder, the parser, and any validation or normalization logic.
- The prompt must be assembled from the current master data rather than a separate hand-maintained prompt copy.
- This design is intended to eliminate silent drift when a label is renamed, retired, or replaced by a new canonical value.

**Acceptance Criteria:**
- An admin can view and edit the allowed event labels from the settings UI
- The label catalog is persisted in the database and loaded into the application at startup
- The application exposes a single, shared taxonomy registry for canonical labels and alias mappings
- Prompt generation, model validation, and runtime parsing all read from that registry instead of private hard-coded lists
- New or retired labels can be added or removed without changing multiple code paths in unrelated classes
- Unknown labels are rejected explicitly and surfaced for admin review rather than silently accepted into the pipeline
- System behavior remains stable even when the prompt or classification schema changes over time

### Story Breakdown Summary: ML Phase 1 Foundation & Follow-On Roadmap

> This summary covers the ML stream from the initial package separation and local Llama validation through the structured-extraction boundary and the confidence/review gating work.
>
> **Status note:** the ML boundary, provider-agnostic adapter contract, normalized inbound contract, structured extraction path, confidence scores, low-confidence review gating, and the evaluation/logging layer are implemented and validated against the deterministic fallback path. Live Llama validation (US-ML1) is still outstanding, so US-ML2 to US-ML5 have not yet been verified against real model output. Phase 2 should wait until that is done.

## Priority Matrix
| Story | Focus | Phase | Dependencies | Status |
|-------|-------|-------|--------------|--------|
| **US-ML1** | Developer can run Llama locally | Phase 1 | None | 🔄 In progress |
| **US-ML2** | Structured recruitment extraction | Phase 1 | US-ML1 | 🔄 In progress |
| **US-ML3** | Event classification | Phase 1 | US-ML1, US-ML2 | 🔄 In progress |
| **US-ML4** | Company and job title extraction | Phase 1 | US-ML2 | 🔄 In progress |
| **US-ML5** | Confidence scoring | Phase 1 | US-ML2, US-ML3, US-ML4 | 🔄 In progress |
| **US-ML6** | Low-confidence review gating | Phase 1 | US-ML5 | ✅ Completed |
| **US-ML7** | Logging and evaluation | Phase 1 | US-ML5, US-ML6 | ✅ Completed |
| **US-ML8** | Label-based mailbox scanning | Phase 1 | US-ML1, US-ML7 | ⏳ Pending |
| **US-ML9** | Sender-targeted mailbox scanning | Phase 1 | US-ML1, US-ML7 | ⏳ Pending |
| **US-ML10** | Live pending until sync classification | Phase 1 | US-ML3, US-ML5, US-ML6 | ✅ Completed |
| **US-ML11** | Canonical event taxonomy as master data | Phase 1 | US-ML3, US-ML5, US-ML7 | 📌 Proposed |

## Operating Principles

- Prefer deterministic validation around model outputs.
- Accept only schema-valid responses from the model layer.
- Keep a human review path for uncertain or high-impact outputs.
- Use Llama as the initial production-grade AI layer until the inhouse model is ready.
- Do not replace Llama with the inhouse model until evaluation proves the inhouse model is better.

## Data and Model Lifecycle

- Data queues: store candidate inputs, model outputs, accepted labels, and disagreement cases.
- Confidence thresholds: route uncertain predictions to fallback or human review.
- Retraining cadence: retrain the inhouse model in controlled batches, not continuously in production.
- Promotion checklist: validate quality, latency, and stability before promotion.
- Cutover criteria: retire Llama only when the inhouse model meets or exceeds the target metrics consistently.

## Local Development

For developer testing, Llama can be run locally first.

Recommended dev pattern:
- run Llama locally
- verify structured output
- compare against rule-based behavior
- store outputs for evaluation

This allows the team to validate the AI flow before any inhouse model work begins.

## Non-Goals for Phase 1

- Building the inhouse model immediately.
- Training from scratch.
- Moving ML logic into outreach.
- Auto-acting on low-confidence predictions.

## Success Criteria

Phase 1 is successful when:
- Llama works locally for developer testing. (Partially verified: installed and one sample returned valid structured output; broader sample set and rule-based comparison outstanding)
- The parsing flow produces stable structured outputs. (Completed)
- The ML package boundary is clear. (Completed)
- The team has a usable evaluation loop. (In progress)
- The data needed for Phase 2 is being captured correctly. (Planned)

Phase 2 is successful when:
- the inhouse model is competitive with Llama
- the inhouse model is measurable against a frozen benchmark
- production routing can prefer the inhouse model safely
- Llama can be retired or kept only as a fallback if needed
