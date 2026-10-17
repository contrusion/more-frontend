# Interactions Intelligence - Phase 1 Stabilization Plan

## 1. Objective
Transform raw interaction classifications into candidate-facing guidance in the middle section of the Interactions Events view.

This phase stabilizes the intelligence model and UX contract before user-story writing.

Related next-phase document:
- `INTERACTIONS_INTELLIGENCE_PHASE_2_PRODUCTION_SCALE.md` defines the target architecture and rollout approach for production-scale implementation.

## 2. Scope
Current implementation status:
- Candidate-only accordion detail layout is active in the Interactions candidate view. It uses Angular Material `mat-accordion` / `mat-expansion-panel` (the same component and styling as the recruiter Candidate Pool "View CV" work-detail panels); each expanded panel renders that thread's detailed insight content lazily.
- Accordion header now shows `Recruiting for a {position}` beside the status message, with the deal-breaker count when present. The client company is intentionally omitted: `thread.companyName` currently holds the recruiter's company (agency), not the client being recruited for.
- Admin timeline remains the baseline view and is not regressed by the candidate-only redesign.

Next extraction story (US-I10):
- Capture the actual client company from the original recruiter email, not the recruiter agency/company identity.
- Extract additional opportunity details from message content such as: required skills, role title, company recruiting for, work location, hybrid/remote/office mode, proposed salary, visa constraints, notice period, interview date, and priority deal-breakers.
- Feed those values into the candidate intelligence model so the accordion, opportunity snapshot, and deeper guidance are built from structured opportunity facts instead of only thread metadata.
- In the accordion header, show the position and actual client company when available (for example: "Senior Java Developer at Best Bank"); if the company is unavailable, show the position alone.
- Show the bottleneck count when available, such as "Deal Breakers (3)".
- Use these extracted facts to help the candidate understand what matters in the opportunity and what actions are likely to move it forward.

In scope:
- Candidate-only middle-panel redesign on Interactions Events.
- Event classification to guidance translation.
- Stage tracker logic driven by EventType plus additionalEventTypes signal history.
- Candidate action planning from detected blockers and missing information.

Out of scope for this phase:
- Admin middle-panel redesign.
- New backend APIs (US-I10 adds backend extraction and persistence, but exposes the data through the existing interaction DTOs; no new endpoints).
- Recruiter-facing intelligence redesign.

## 3. View Segmentation Rule
- Candidate view: middle panel shows intelligence and guidance.
- Admin view: middle panel remains the timeline for classification testing.

Environment and role access model:
- Candidate and recruiter interactions access remains enabled in local, INT, and production.
- Admin interactions access is enabled locally for testing and disabled in INT/production.
- Enforcement must use centralized feature flags plus role-aware route guards.

No regression target:
- Existing admin timeline behavior remains unchanged.

## 4. Candidate Middle Panel Information Architecture
Section order (top to bottom):
1. Opportunity Snapshot
2. Stage Tracker
3. Job Spec Intelligence
4. Candidate Action Plan
5. Risk and Bottleneck Panel

Layout as implemented in the candidate accordion (the five sections above are consolidated so the same guidance is not repeated in several places):
1. Stage timeline (Opportunity Snapshot stage and Stage Tracker)
2. Next unlock (with confidence) beside Take note (Candidate Action Plan and Risk and Bottleneck Panel)
3. Opportunity overview, including the fit check and stated deal breakers (Job Spec Intelligence)

The separate Current stage / Confidence / Latest activity cards, the summary paragraph and the "Conversation insights" container (recruiter stats and general recommended actions) were removed because the stage is already shown by the timeline and the header chip, and the recommendations repeated Take note. Confidence is shown as small text beside "Next unlock". The admin right-hand Conversation Insights panel is unchanged.

### 4.1 Opportunity Snapshot
Purpose:
- Answer: Where do I stand right now?

Content:
- Role and company context.
- Current stage and confidence level.
- Freshness signal (time since last meaningful event).
- One-line explanation derived from recent key events.

### 4.2 Stage Tracker
Purpose:
- Answer: What phase am I in and what unlocks the next one?

Pipeline:
- Contacted -> Qualified -> Interviewing -> Decision

Tracker output:
- Current stage.
- Stage confidence (Low/Medium/High).
- Next unlock condition.
- Missing evidence list when confidence is low.

Placement and presentation (accordion view):
- The tracker sits at the top of the expanded panel, to the right of the opportunity heading, rather than as a card in the section grid.
- It renders as a horizontally scrollable rail (`app-stage-timeline`, presentational) in the style of the Living CV career journey, but the nodes follow the stage pipeline rather than the raw activity taxonomy: Outreach, Screening, Interviews & Assessments, optional Offer stage, explicit decision outcome (`Unsuccessful` when a negative terminal signal exists), and Closed. The pipeline stage also appears in the accordion header chip so the header and rail use the same stage vocabulary, while the newest event group remains in the "Latest activity" card.
- The current stage is highlighted in the middle of the rail when applicable, earlier stages show as completed ticks, and the next realistic stage(s) remain visible as upcoming nodes. The Offer stage only appears once the process has reached interviews. `Closed` is rendered as a neutral completion state, and negative terminal outcomes are shown in the preceding `Unsuccessful` node.
- Each node shows the first time that stage appeared in the thread and a count for repeated events that contributed to it. Completed nodes use a tick marker instead of a solid filled dot.
- The rail scrolls instead of collapsing older nodes behind a "+N earlier" label, so the current position and the next stage remain visible without losing context.
- Next unlock and missing evidence are shown directly beneath the timeline, with confidence as small text beside the "Next unlock" label and a "Take note" panel to the right (stacked below 56rem). The Opportunity overview follows below and now holds the fit check and stated deal breakers (see 4.3). The separate stage cards, summary paragraph, "Action plan" and "Risk & bottlenecks" sections were removed from the accordion because they repeated Next unlock and Take note (see 4.4 and 4.5).
- "Take note" lists up to 6 items, most severe first (danger, warning, success, info, neutral; ties keep the order below), generated deterministically by `utils/candidate-notes.util.ts`. When more than 6 notes apply, the least severe (informational and "Coming up") are dropped first so blockers are never pushed out. It covers the current stage (interview date, pending CV, pending assessment, rejected interview time, stale thread, stated salary/notice/location terms), blockers (location or compensation not aligned, screening not passed, deal breakers stated) and a "Coming up" heads-up for the next stage (screening, interviews, offer readiness, or feedback/re-engagement after a decision). A location, compensation or screening blocker note disappears once the matching needs-met or passed signal arrives. Interview dates come from `facts.interviewDate`: green when in the future, red when past, neutral raw text when the date cannot be parsed. The panel is hidden when there is nothing to note. Notes that call for the candidate to do something carry a compact action button (for example "Send CV", "Suggest times", "Clarify location", "Clarify range", "Add to calendar", "Request feedback", "Prepare answers"). The buttons are presentational for now; their behaviour is defined in US-I13 to US-I15, and informational notes (stated terms, "Door still open", "Interviews likely next") have no button.
- Stacks to a single column below 56rem; transitions are short and disabled under `prefers-reduced-motion`.
- The conversation list ends with the shared `app-scroll-top` button (`shared/components/scroll-top`, a PrimeNG ScrollTop with app theme tokens and reduced-motion handling) so long lists of expanded threads can be left quickly.

### 4.3 Job Spec Intelligence
Purpose:
- Answer: How well does this opportunity align with me?

Signals:
- Job spec written/shared/reviewed state.
- Screening inquiry signals for location, compensation, visa, notice period, availability, benefits.
- Skills-fit signals (skills asked vs confirmed gap).
- Blocking risk indicators.

Checklist dimensions:
- Skills fit.
- Location fit.
- Compensation fit.
- Timing fit.

Placement (accordion view):
- The fit check lives inside the Opportunity overview as compact rows (dimension, what the recruiter stated, status chip), for example "Location: Hybrid, Cape Town: Aligned". The status comes from the fused signals and the stated fact from the extracted `OpportunityFacts`; a dimension with no stated fact shows "Not stated yet".
- Deal breakers stated in the emails are listed as chips under the fit rows with their count.

### 4.4 Candidate Action Plan
Purpose:
- Answer: What should I do now?

Output rules:
- Maximum 3 prioritized actions.
- Each action includes reason and urgency.
- Wording is coaching-focused, never taxonomy-focused.

Status (accordion view):
- The standalone section is removed. Its stage-based advice repeated "Next unlock", and its bottleneck-specific advice (clarify location, reconfirm compensation, ask for assessment feedback) now lives in Take note as blocker notes with action buttons.

### 4.5 Risk and Bottleneck Panel
Purpose:
- Answer: What might stall this opportunity?

Risk classes:
- Compensation bottleneck.
- Location bottleneck.
- Process delay.
- Failed screening assessment.

For each risk:
- Evidence summary.
- Suggested strategy.
- Fallback choice (defer/close) when required.

Status (accordion view):
- The standalone panel is removed. Location, compensation and screening blockers, interview timing friction and process delay ("No movement") are Take note items; deal breakers appear in both Take note (as an action to confirm them) and the Opportunity overview (the stated facts). The accordion header still shows the "Deal breakers (N)" count.
- The legacy non-accordion candidate panel (unreachable in the current role-mode split) still contains the old sections.

## 5. Stage Tracker Intelligence Model

## 5.1 Stage Definitions
- Contacted: Outreach exists, basic interest still forming.
- Qualified: CV, job spec, and screening-fit signals indicate mutual progression.
- Interviewing: Interview scheduling/invite signals active.
- Decision: Not interested, rejection, or explicit closure outcomes.

## 5.2 Stage Priority Resolution
When conflicting events exist, resolve by strongest terminal signal:
1. Decision events override all previous stage states.
2. Interviewing signals override Qualified and Contacted.
3. Qualified signals override Contacted.
4. Contacted is default when only early engagement exists.

## 5.3 Confidence Heuristics
- High: stage inferred from multiple reinforcing events.
- Medium: stage inferred from a single strong event.
- Low: stage inferred from weak or stale evidence.

## 5.4 Multi-Event Signal Fusion
Classification must use both values from each event record:
- Primary signal: eventType.
- Secondary signals: additionalEventTypes.

Fusion rules:
1. Build a deduplicated per-thread signal timeline from eventType + additionalEventTypes.
2. Use stage priority rules on the fused set, not on primary eventType alone.
3. Preserve contradictory signals as risk context (for example INTERVIEW_TIME_PROPOSED plus INTERVIEW_TIME_PROPOSED_REJECTED).
4. Drive guidance from the newest dominant signal, but include unresolved secondary blockers in the action plan.

## 5.5 Activity Group Indicator (replaces time-based freshness)
The "Latest activity" card shows the status group of the newest event (primary plus additional types), not an age bucket. Age is already shown by the "Updated" chip. The accordion header chip now shows the inferred current stage so it stays aligned with the stage rail.

Groups are defined in `interactions/utils/activity-group.util.ts`. When several signals are present the first group in this table wins:

| Group | Tone | Event types |
|---|---|---|
| Closed | danger | REJECTION, NOT_INTERESTED |
| Needs attention | warning | COMPENSATION_BOTTLENECK, LOCATION_BOTTLENECK, SKILLS_GAP, SCREENING_ASSESSMENT_FAILED, INTERVIEW_TIME_PROPOSED_REJECTED |
| Interviews & Assessments | success | INTERVIEW_INVITE, INTERVIEW_TIME_PROPOSED, INTERVIEW_TIME_ACCEPTED, INTERVIEW_SCHEDULED, SCREENING_ASSESSMENT_REQUEST / SCHEDULED / COMPLETED / COMPLETION_ACKNOWLEDGEMENT |
| On track | success | COMPENSATION_NEEDS_MET, LOCATION_NEEDS_MET, SCREENING_ASSESSMENT_PASSED, INTERESTED |
| Screening | info | INQUIRY, SKILLS / COMPENSATION / LOCATION / VISA / NOTICE_PERIOD / AVAILABILITY / BENEFITS inquiries, CV_REQUEST, CV_SUBMITTED, JOB_SPEC_* |
| Process update | neutral | RECRUITEMENT_PROCESS_UPDATE |
| Outreach | neutral | OUTREACH, INTEREST_CHECK, REPLY, FOLLOW_UP, ACKNOWLEDGEMENT, PENDING_CLASSIFICATION |

Tone maps to the semantic tokens in `styles.css` and expresses how positive the status is for the candidate.

## 6. EventType Intelligence Guide Catalog
This catalog defines how each EventType contributes to:
- Stage contribution
- Candidate guidance
- Risk detection
- Next-unlock logic

Legend:
- Stage impact: Contacted | Qualified | Interviewing | Decision | Neutral
- Risk flag: None | Low | Medium | High

### 6.1 Early Engagement and Communication
1. OUTREACH
- Stage impact: Contacted
- Guidance: A recruiter opened a conversation. Reply quickly to keep momentum.
- Risk flag: Low if no reply within 3 days.
- Next unlock: Candidate reply or interest confirmation.

2. REPLY
- Stage impact: Contacted
- Guidance: You replied. Wait for recruiter response or send follow-up after threshold.
- Risk flag: Low
- Next unlock: Recruiter progression signal (spec/CV/screening).

3. FOLLOW_UP
- Stage impact: Contacted
- Guidance: Follow-up activity detected. Keep thread active and specific.
- Risk flag: Medium if repeated without progression.
- Next unlock: Concrete process signal.

4. ACKNOWLEDGEMENT
- Stage impact: Neutral
- Guidance: Message acknowledged. No substantive progression yet.
- Risk flag: Low
- Next unlock: Inquiry, spec, CV, or interview signal.

5. RECRUITEMENT_PROCESS_UPDATE
- Stage impact: Neutral (contextual enhancer)
- Guidance: Process update received. Re-check expected timeline and required next step.
- Risk flag: Medium when update indicates delay.
- Next unlock: explicit action from update details.

### 6.2 Interest and Intent
6. INTEREST_CHECK
- Stage impact: Contacted
- Guidance: Recruiter is testing your interest. Confirm intent clearly.
- Risk flag: Medium if unanswered.
- Next unlock: INTERESTED or NOT_INTERESTED.

7. INTERESTED
- Stage impact: Qualified candidate intent signal
- Guidance: Interest confirmed. Move to fit/qualification details.
- Risk flag: Low
- Next unlock: CV/spec/screening progression.

8. NOT_INTERESTED
- Stage impact: Decision
- Guidance: Opportunity likely closed by your choice.
- Risk flag: High terminal
- Next unlock: None unless re-opened by new outreach.

9. REJECTION
- Stage impact: Decision
- Guidance: Process ended with unsuccessful outcome.
- Risk flag: High terminal
- Next unlock: None for this thread.

### 6.3 CV and Qualification Signals
10. CV_REQUEST
- Stage impact: Qualified candidate precondition
- Guidance: Recruiter needs your CV. Submit latest targeted version.
- Risk flag: Medium if outstanding.
- Next unlock: CV_SUBMITTED.

11. CV_SUBMITTED
- Stage impact: Qualified
- Guidance: CV submitted. Expect screening/spec/interview signals next.
- Risk flag: Low
- Next unlock: Screening or interview progression.

### 6.4 Job Spec Signals
12. JOB_SPEC_REQUEST
- Stage impact: Qualified evidence gathering
- Guidance: Ask for role details if still missing.
- Risk flag: Low
- Next unlock: JOB_SPEC_WRITTEN_IN_MAIL_TEXT or JOB_SPEC_ATTACHED.

13. JOB_SPEC_TO_BE_SENT
- Stage impact: Qualified pending
- Guidance: Recruiter indicated spec will be sent. Set follow-up reminder.
- Risk flag: Medium if delayed.
- Next unlock: JOB_SPEC_WRITTEN_IN_MAIL_TEXT or JOB_SPEC_ATTACHED.

14. JOB_SPEC_WRITTEN_IN_MAIL_TEXT
- Stage impact: Qualified
- Guidance: Job spec available. Evaluate fit and respond with clarifying questions.
- Risk flag: Low
- Next unlock: JOB_SPEC_REVIEWED and inquiry resolution.

15. JOB_SPEC_ATTACHED
- Stage impact: Qualified
- Guidance: Role details delivered. Confirm receipt and evaluate alignment.
- Risk flag: Low
- Next unlock: JOB_SPEC_REVIEWED.

16. JOB_SPEC_REVIEWED
- Stage impact: Qualified reinforcement
- Guidance: You reviewed the role. Convert insights into concrete next-step response.
- Risk flag: Low
- Next unlock: Interview/screening progression.

### 6.5 Screening and Assessment Signals
17. SCREENING_ASSESSMENT_REQUEST
- Stage impact: Qualified -> Interviewing gateway
- Guidance: Assessment required. Plan completion window and submit early.
- Risk flag: Medium if pending.
- Next unlock: scheduled/completed/acknowledged.

18. SCREENING_ASSESSMENT_SCHEDULED
- Stage impact: Interviewing pre-state
- Guidance: Assessment scheduled. Prepare and confirm logistics.
- Risk flag: Low
- Next unlock: completed or acknowledgement.

19. SCREENING_ASSESSMENT_COMPLETED
- Stage impact: Interviewing or late Qualified reinforcement
- Guidance: Assessment complete. Expect decision or interview progression.
- Risk flag: Medium if no follow-up after threshold.
- Next unlock: process update or interview invite.

20. SCREENING_ASSESSMENT_COMPLETION_ACKNOWLEDGEMENT
- Stage impact: Interviewing progression support
- Guidance: Completion acknowledged. Follow expected next timeline.
- Risk flag: Low
- Next unlock: interview progression or decision update.

21. SCREENING_ASSESSMENT_PASSED
- Stage impact: Interviewing reinforcement
- Guidance: Assessment passed. Expect interview scheduling or process update.
- Risk flag: Low
- Next unlock: interview progression.

22. SCREENING_ASSESSMENT_FAILED
- Stage impact: Decision risk, not always terminal
- Guidance: Screening result may block progress. Request feedback and evaluate alternatives.
- Risk flag: High
- Next unlock: process update or thread closure.

### 6.6 Interview Signals
23. INTERVIEW_TIME_PROPOSED
- Stage impact: Interviewing
- Guidance: Interview timing proposed. Respond with availability quickly.
- Risk flag: Medium if unanswered.
- Next unlock: time accepted or scheduled.

24. INTERVIEW_INVITE
- Stage impact: Interviewing
- Guidance: Interview invitation received. Confirm intent and schedule.
- Risk flag: Low
- Next unlock: time accepted or scheduled.

25. INTERVIEW_TIME_PROPOSED_REJECTED
- Stage impact: Interviewing friction signal
- Guidance: Proposed time was rejected. Offer alternative slots quickly.
- Risk flag: Medium
- Next unlock: INTERVIEW_TIME_PROPOSED or INTERVIEW_TIME_ACCEPTED.

26. INTERVIEW_TIME_ACCEPTED
- Stage impact: Interviewing reinforcement
- Guidance: Interview terms accepted. Prepare and confirm logistics.
- Risk flag: Low
- Next unlock: INTERVIEW_SCHEDULED.

27. INTERVIEW_SCHEDULED
- Stage impact: Interviewing strong signal
- Guidance: Interview is scheduled. Prepare focused talking points.
- Risk flag: Low
- Next unlock: decision/process update events.

### 6.7 Inquiry and Fit Signals
28. INQUIRY
- Stage impact: Qualified context signal
- Guidance: Clarifying details requested. Provide complete answers to avoid delays.
- Risk flag: Medium if unresolved.
- Next unlock: subtype inquiries resolved.

29. SKILLS_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Skills evidence requested. Respond with concrete examples and proficiency depth.
- Risk flag: Medium if vague.
- Next unlock: SKILLS_GAP resolved or fit confirmation.

30. SKILLS_GAP
- Stage impact: Qualified/Interviewing progression blocker
- Guidance: Skill mismatch surfaced. Clarify adjacent experience and learning runway.
- Risk flag: High
- Next unlock: skills alignment, alternative role, or closure.

31. COMPENSATION_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Compensation expectations requested. Respond with realistic range.
- Risk flag: Medium if missing response.
- Next unlock: alignment or bottleneck resolution.

32. COMPENSATION_BOTTLENECK
- Stage impact: Qualified/Interviewing progression blocker
- Guidance: Compensation mismatch detected. Reframe expectations or defer.
- Risk flag: High
- Next unlock: negotiated alignment or close/defer.

33. COMPENSATION_NEEDS_MET
- Stage impact: Qualified/Interviewing positive-fit signal
- Guidance: Compensation alignment confirmed. Progress to scheduling and process movement.
- Risk flag: Low
- Next unlock: interview/process progression.

34. LOCATION_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Location preference requested. Clarify remote/hybrid constraints.
- Risk flag: Medium if ambiguous.
- Next unlock: alignment or bottleneck detection.

35. LOCATION_BOTTLENECK
- Stage impact: Qualified/Interviewing progression blocker
- Guidance: Location mismatch may stall process. Explore flexibility options.
- Risk flag: High
- Next unlock: alignment or close/defer.

36. LOCATION_NEEDS_MET
- Stage impact: Qualified/Interviewing positive-fit signal
- Guidance: Location expectations aligned. Keep momentum toward interview and decision stages.
- Risk flag: Low
- Next unlock: interview/process progression.

37. VISA_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Sponsorship/visa details requested. Provide precise status.
- Risk flag: Medium
- Next unlock: policy alignment.

38. NOTICE_PERIOD_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Start-date feasibility requested. Share realistic notice constraints.
- Risk flag: Medium
- Next unlock: timeline alignment.

39. AVAILABILITY_INQUIRY
- Stage impact: Qualified -> Interviewing progression signal
- Guidance: Availability requested. Offer concrete slots quickly.
- Risk flag: Medium if unanswered.
- Next unlock: interview scheduling.

40. BENEFITS_INQUIRY
- Stage impact: Qualified fit signal
- Guidance: Benefits expectations discussed. Confirm must-have vs optional items.
- Risk flag: Medium
- Next unlock: fit alignment.

### 6.8 System State
41. PENDING_CLASSIFICATION
- Stage impact: Neutral
- Guidance: Message not yet classified. Await sync or manual review.
- Risk flag: Low
- Next unlock: resolved classification event.

## 7. Candidate Guidance Composition Rules

## 7.1 Narrative Template
Use this structure:
- Current state sentence.
- Why sentence (event evidence).
- Blocker sentence (if any).
- Action sentence (top 1-3 next steps).

Example form:
- You are currently in [stage] for [role/company].
- This is based on [event evidence].
- The main blocker is [risk], if present.
- Next, do [action 1], [action 2], and [action 3].

## 7.2 Tone Rules
- Coaching, practical, and concise.
- No raw EventType labels in user-facing copy.
- No internal confidence formulas shown to user.

## 8. Non-Functional Stabilization Rules
- Keep translation logic deterministic and testable.
- Preserve admin timeline rendering and controls.
- Keep candidate intelligence in middle panel only for Phase 1.
- Add unit tests for stage inference and action-plan inference before implementation sign-off.
- Keep feature-toggle reads centralized through `FeatureFlagsService`; avoid direct environment checks in components/guards/routes.

## 9. Open Design Decisions to Finalize Before User Stories
1. Admin timeline controls (candidate remains guidance-only):
- Option A: keep current admin timeline always visible (no toggle).
- Option B: add an admin-only compact timeline toggle (expanded vs compact density).

2. Confidence display:
- Option A: textual (Low/Medium/High).
- Option B: textual plus confidence meter.

3. Failed screening handling:
- Option A: treat as recoverable unless explicit rejection exists.
- Option B: treat as terminal unless process update indicates continuation.

4. Multi-opportunity context:
- Option A: intelligence per selected thread only.
- Option B: aggregate opportunity heatmap in right panel.

## 9.1 Decision Table (Proposed Defaults)
| Decision Area | Option A | Option B | Recommended Default | Rationale |
|---|---|---|---|---|
| Admin timeline controls | Always visible timeline (no toggle) | Admin-only compact timeline toggle | Option B | Keeps admin testing powerful while improving scan efficiency for large threads; candidate mode stays focused on guidance. |
| Candidate timeline visibility | Guidance only (no timeline toggle) | Guidance plus candidate toggle | Option A | Avoids cognitive overload and keeps candidate experience action-oriented. |
| Confidence display | Text only (Low/Medium/High) | Text plus confidence meter | Option A (Phase 1) | Faster implementation and easier calibration; meter can be introduced in Phase 2 after confidence tuning. |
| Failed screening handling | Recoverable unless explicit rejection | Terminal unless process update indicates continuation | Option A | Better candidate coaching behavior and avoids prematurely closing viable opportunities. |
| Multi-opportunity context | Per selected thread only | Aggregate heatmap on right panel | Option A (Phase 1) | Reduces complexity; allows stable single-thread intelligence before cross-thread synthesis. |

## 9.2 Decision Notes
- Candidate middle panel should remain guidance-first with no timeline toggle in Phase 1.
- Any timeline density toggle belongs to admin only and must not alter classification-testing fidelity.
- If Option B is selected for admin toggle, default should open in expanded mode to preserve existing admin behavior.

## 10. Phase 1 Exit Criteria
This plan is considered stable when:
- EventType catalog mapping is approved.
- Stage inference rules are approved.
- Candidate IA section order is approved.
- Admin no-regression constraint is approved.

User stories and the completion matrix for Phase 1 are defined below.

## 11. Phase 1 User Stories and Completion Matrix

## 11.1 Implementation Order
| Sprint | Stories | Rationale |
|---|---|---|
| Sprint 1 | US-I1, US-I2 | Establish the top-of-panel candidate context and stage baseline first |
| Sprint 2 | US-I3, US-I4 | Add fit interpretation and action guidance once stage context exists |
| Sprint 3 | US-I5, US-I6 | Complete risk synthesis and deterministic multi-signal engine behavior |
| Sprint 4 | US-I7, US-I8, US-I9 | Preserve admin fidelity, optional admin compact toggle, and test hardening |

## 11.2 User Stories

Note before implementing: When implementing these user stories. Don't just use cards for everything, don't just use the easiest approaches. Let's make the ui elegant, remember this is for production. Make sure to use appropriate components from prime ng or material ui. Prime ng also has some templates, try to mimic some templates that would look greate for what we are trying to do. whatever you do, keep to the theme colours of the application and always consult instruction files.

### Epic: Candidate Intelligence Middle Panel

#### US-I1: Candidate Sees Opportunity Snapshot
As a candidate  
I want to see a compact opportunity snapshot at the top of the Interactions middle panel  
So that I immediately understand current status, recency, and context before reading the full thread

Acceptance Criteria:
- Snapshot shows role title, company, current stage, and freshness label (Fresh, Watch, Stale).
- Snapshot includes a one-line explanation derived from latest dominant signals.
- If role or company is missing, snapshot shows a graceful placeholder without breaking layout.
- Snapshot appears only in candidate mode and never replaces admin timeline mode.

Frontend changes required:
- Add Opportunity Snapshot section to candidate middle panel container.
- Add computed state for freshness bucket using existing event timestamps.

Phase: Phase 1  
Dependencies: Interaction thread selection state

#### US-I2: Candidate Sees Stage Tracker With Confidence and Next Unlock
As a candidate  
I want the platform to show my current stage, confidence, and next unlock criteria  
So that I know exactly what progress means and what signal moves me forward

Acceptance Criteria:
- Stage pipeline is shown as Contacted -> Qualified -> Interviewing -> Decision.
- Current stage is inferred using priority rules from the approved Phase 1 model.
- Confidence state is shown as Low, Medium, or High using deterministic heuristics.
- "Next unlock" text is shown and updates whenever dominant signals change.
- "Missing evidence" list is shown when confidence is Low.

Frontend changes required:
- Add stage inference utility using fused signal set.
- Add confidence computation utility and missing-evidence generator.

Phase: Phase 1  
Dependencies: US-I1

#### US-I3: Candidate Sees Job Spec Intelligence and Fit Checklist
As a candidate  
I want a fit-oriented interpretation of the role details and requirements  
So that I can decide whether to proceed and what clarifications to send

Acceptance Criteria:
- Section displays job spec state using job-spec signals.
- Checklist dimensions include skills fit, location fit, compensation fit, and timing fit.
- Skills gap and inquiry signals update checklist state deterministically.
- Blocking indicators are surfaced when bottleneck signals are present.
- Language remains coaching-focused and hides raw event taxonomy labels.

Frontend changes required:
- Add fit checklist model and rendering component section.
- Map signals to checklist states and blocker badges.

Phase: Phase 1  
Dependencies: US-I2

#### US-I4: Candidate Receives Top 3 Action Plan
As a candidate  
I want prioritized next-step actions with reasons and urgency  
So that I can take the most impactful actions first

Acceptance Criteria:
- System returns at most 3 actions at any time.
- Each action includes action text, reason, and urgency level.
- Actions are derived from unresolved blockers and missing progression signals.
- If no high-priority action exists, section shows a stable monitoring message.
- Action plan updates when new classified events are added.

Frontend changes required:
- Add deterministic action-ranking utility.
- Add action-plan UI section with urgency visuals.

Phase: Phase 1  
Dependencies: US-I2, US-I3

#### US-I5: Candidate Sees Risk and Bottleneck Panel
As a candidate  
I want risks called out with evidence and fallback options  
So that I can recover stalled opportunities quickly

Acceptance Criteria:
- Panel detects and displays compensation, location, process-delay, and screening-failure risks.
- Each risk row includes evidence summary, suggested strategy, and fallback option.
- Contradictory interview-time signals are shown as scheduling friction risk.
- Terminal decision signals reduce noise by suppressing lower-priority risk cards.

Frontend changes required:
- Add risk aggregation utility from fused signals.
- Add risk panel section with severity labeling.

Phase: Phase 1  
Dependencies: US-I4

### Epic: Multi-Signal Intelligence Engine (Frontend Domain Logic)

#### US-I6: System Uses Multi-Event Signal Fusion for Stage, Guidance, and Risk
As the system  
I want to combine primary and secondary event signals for every interaction thread  
So that guidance reflects full context instead of only the primary label

Acceptance Criteria:
- Fused timeline includes eventType plus additionalEventTypes from every thread event.
- Duplicate signals are deduplicated in a stable order.
- Stage, action plan, and risk computations run on fused signals, not primary-only signals.
- Conflicting signals are preserved as context for risk and guidance.
- Signal fusion behavior is deterministic and covered by unit tests.

Frontend changes required:
- Add fusion helper in interactions domain service or utility layer.
- Refactor existing status-summary and guidance mappers to consume fused signals.

Phase: Phase 1  
Dependencies: interaction event model already includes additionalEventTypes

### Epic: Admin Non-Regression and Access Pattern

#### US-I7: Admin Timeline Fidelity Is Preserved
As an admin  
I want to retain the existing classification-testing timeline experience  
So that candidate intelligence changes do not disrupt operational validation flows

Acceptance Criteria:
- Admin middle panel stays timeline-first.
- Candidate intelligence sections are not rendered in admin mode.
- Existing admin interactions access guard behavior remains intact.
- Existing admin sorting and event inspection workflow remains unchanged.

Frontend changes required:
- Keep center-panel mode split explicit and testable.
- Add regression tests for admin rendering path.

Phase: Phase 1  
Dependencies: current role-aware mode switching

#### US-I8: Admin Can Toggle Compact Timeline Density (Optional Default)
As an admin  
I want an optional compact timeline density toggle  
So that I can scan high-volume threads faster while preserving event fidelity

Acceptance Criteria:
- Toggle is visible only in admin mode.
- Default remains expanded on first load.
- Compact mode changes spacing only, not data content.
- Toggle state persists per user session.

Frontend changes required:
- Add admin-only timeline density toggle state.
- Add compact CSS variant for timeline rows.

Phase: Phase 1 (optional)  
Dependencies: US-I7

### Epic: Quality and Stability

#### US-I9: Deterministic Intelligence Test Coverage
As the product team  
I want deterministic unit coverage for stage, action, and risk inference  
So that phase behavior remains stable as event taxonomy evolves

Acceptance Criteria:
- Unit tests cover stage inference priority resolution.
- Unit tests cover confidence and freshness heuristics.
- Unit tests cover multi-signal fusion, including contradictory signals.
- Unit tests cover action prioritization and risk aggregation behavior.
- No regressions in existing interactions component and guard tests.

Frontend changes required:
- Add focused spec files for inference utilities.
- Extend existing interactions specs with candidate and admin mode assertions.

Phase: Phase 1  
Dependencies: US-I2 through US-I8

#### US-I10: Extract Client Opportunity Metadata from Recruiter Email
As a recruiter or platform intelligence system  
I want the real opportunity details extracted from the email thread  
So that the candidate sees the details that actually matter to the role and can act with better context

Acceptance Criteria:
- The accordion header prefers the actual client company and job title from recruiter email content when present.
- If the client company is not available, the header shows the position title alone without degrading layout.
- Example format: "Senior Java Developer at Best Bank".
- The recruiter company name is never used as the client company in the candidate-facing header.
- The model extracts opportunity facts that matter to decision-making from the email, including: required skills, role title, company recruiting for, work location, hybrid/remote/office pattern, salary, visa constraints, notice period, interview date, and deal-breakers.
- Bottleneck count is shown when the data is available, e.g. "Deal Breakers (3)".
- Missing metadata falls back gracefully to generic placeholders without breaking the UI contract.
- These extracted facts are available to candidate guidance logic so the platform can help the candidate assess fit and next steps.

Design decisions (agreed):
- The recruiter's company stays as it is today (derived from the recruiter email address/domain) and remains linked to the recruiter. It is never shown as the client company.
- The client company is extracted from the email text by a separate, event-driven extraction step, not by the event classification call. Reasons are model-agnostic: failure isolation and retry, different input (thread context vs newest message), extraction only for recruiter-relevant recruiter-sent messages, and the classifier contract stays comparable between Llama and the in-house model (see `ML_Phase_2.md`).
- Client companies are linked to the interaction, not the recruiter. One interaction can link to multiple companies. Each message's extraction result is stored as a `JSONB` column on the interaction event (a list of `{companyId, title, facts}`), so each extraction writes only its own event row (no lost updates, idempotent replay). No new table and no change to `recruiter_interactions`; the interaction's companies are derived at read time from its events.
- The model never guesses a website. It returns a website only when it appears literally in the email. When only a company name is given, the company is created with the existing placeholder website and the header shows the name without a link.
- Website discovery for name-only companies is a later, verified, asynchronous step. Any URL taken from an email or discovered later must pass SSRF guards: http(s) only, block private/loopback/link-local addresses after DNS resolution, capped redirects, short timeout, response body discarded.
- Websites matching the sender's domain, known non-company domains (job boards, LinkedIn, calendar links, URL shorteners) are rejected as client websites.
- Company creation follows the existing fire-and-forget pattern, triggered after commit on a configurable bounded executor, idempotent per event, with a status (PENDING, DONE, FAILED) and a retry sweeper so extraction never blocks or fails email sync.
- Extraction results are merged at read time (frontend, alongside the signal fusion from US-I6) by company and normalised title, ordered by message timestamp. A newer null never overwrites an existing value.
- Interim multi-opportunity header (until US-I11): show the most recent opportunity followed by "+N more" when the thread has more than one.
- No backfill. Existing data is cleared and mailboxes are rescanned.

Backend + frontend changes required:
- Flyway migration (versioned per project convention) adding the extraction `JSONB` column and the extraction status column (PENDING, DONE, FAILED) to interaction events. No new table. Check existing migrations first.
- New extraction service interface and implementation with its own prompt and model configuration; returns a list of opportunities `{companyName, website?, title, facts}`.
- Post-commit event, listener and retry sweeper; company resolution reusing the existing find-or-create and placeholder-company logic; SSRF-guarded website handling.
- Expose each event's extracted opportunities through the existing interaction event DTOs.
- Add an `OpportunityContext` data contract (skills, location, mode, salary, company, position, interview date, deal-breakers) to the frontend model and map it in the interaction service.
- Update the accordion header mapping to use the actual client context instead of `recruiter.companyName`, and feed extracted facts and deal-breakers into the guidance logic.
- Unit tests for extraction parsing, website rejection rules, SSRF guards, idempotent replay and merge rules; frontend specs for the header formats and fallbacks.

Phase: Current workstream / same phase  
Dependencies: US-I1, US-I6

#### US-I11: Candidate Sees Multiple Opportunities Within One Recruiter Thread
As a candidate  
I want a recruiter thread that pitches several roles or companies to show each opportunity separately  
So that I can assess, compare, and respond to each role instead of seeing one blended summary

Acceptance Criteria:
- A thread with more than one extracted opportunity shows them as distinct items, each with its own role title, client company, and key facts.
- The accordion header gives a clear multi-role summary, for example "2 roles: Java Developer at A, Data Engineer at B". Exact format to be decided.
- Fit checklist, deal-breaker count, and action guidance can be scoped to a single opportunity, with a thread-level view when none is selected.
- Single-opportunity threads look and behave exactly as they do after US-I10.
- When a later email adds, changes, or withdraws one opportunity, only that opportunity updates.

Open questions (not yet decided):
- Is stage tracking per thread or per opportunity?
- How are candidate replies attributed to a specific opportunity?
- Does the right panel need an opportunity selector?
- Is the interim US-I10 header rule (most recent opportunity plus "+N more") the right behaviour, or should it show only the first opportunity or a "N roles" summary? Not yet confirmed.

Side note (storage):
- US-I10 keeps extracted opportunities as `JSONB` on interaction events and derives them at read time. If this story or a recruiter-side view needs cross-interaction queries (for example "which interactions mention company X"), introduce an `interaction_opportunities` table (interaction, company, role title, facts, source event) at that point, backfilled from the per-event JSON. Consider a `@Version` or per-opportunity rows if opportunities must be edited independently of events.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: US-I10 (extracted opportunities on interaction events)

#### US-I12: Candidate Gets Job Spec Attachment Intelligence and Profile Fit
As a candidate  
I want the job spec a recruiter attaches to be read and compared with my profile  
So that I see my skill coverage, gaps, interview tips and an evidence-backed fit verdict before I respond

Acceptance Criteria:
- Job spec attachments (PDF, DOCX, TXT) on recruiter emails are fetched and converted to text; unsupported, oversized or unreadable files (for example scanned PDFs) show a clear "couldn't read this spec" state instead of failing silently.
- A structured job spec is extracted: required and nice-to-have skills, seniority, responsibilities, tech stack, and salary/location when stated.
- Each required skill is mapped against the candidate's profile as strong, partial or missing, using deterministic matching (including a synonym map such as "Spring Boot" vs "Spring"), not model judgement.
- The candidate sees gaps with a suggested action for each, interview preparation tips tied to the spec, and a fit verdict (for example Strong, Partial, Weak) with the evidence behind it (for example "requires 5y Java, your profile shows 3y").
- Narrative output (gap explanations, interview tips, fit summary) is generated by the model from the structured match result, never from raw attachment text.
- The section replaces the signal-only skills and role fit rows from US-I3 when a spec has been analysed; without a spec it falls back to the US-I3 behaviour.
- Attachment text is treated as untrusted data: it cannot alter model instructions, and model output is validated against a schema before it is stored or shown.
- Document text is not logged, and only derived data is stored.

Design decisions (proposed, to be confirmed):
- Gmail access: the existing `gmail.readonly` scope already allows downloading attachments, so no new consent is needed. `GmailInboundEmailSourceAdapter` currently reads only text parts, so it must also collect parts with a filename and `body.attachmentId` and fetch them through the Gmail attachments API, with a MIME allow-list and a size cap.
- Text extraction happens server-side (for example Apache Tika, or PDFBox and POI). The model never receives raw files. OCR is out of scope for v1.
- Spec extraction is a separate event-driven step with its own prompt and model configuration, following the US-I10 pattern: after-commit dispatch on a bounded executor, PENDING/DONE/FAILED status, attempts counter and a retry sweeper, so email sync is never blocked or failed. It may extend the opportunity extraction rather than add a second pipeline.
- The extracted spec is stored as `JSONB` on the interaction event (derived data only, no attachment bytes unless a retention need is agreed). Check existing migrations first; no new table is expected.
- Matching is deterministic and testable; the model is used only for narrative. This keeps results stable and auditable and works with a small local Llama.
- Long specs are truncated or chunked to fit the model context; the request timeout and executor limits follow the `more.ml.*` configuration.
- Privacy: job specs and CV data are personal data. Keep processing on the local model, avoid logging document content, and apply a retention rule to extracted content.
- A spec belongs to a specific opportunity, so this story depends on how US-I11 scopes opportunities within a thread. Until US-I11 is decided, attach the spec to the primary opportunity.

Open questions (not yet decided):
- Which candidate data is the source of truth for skills and years of experience (Living CV, profile, or an uploaded CV)?
- Is a fit verdict acceptable for candidates, or should the section show coverage and gaps only?
- Which file types and size cap are supported in v1, and what is the retention period for extracted spec data?
- Should specs pasted into the email body (`JOB_SPEC_WRITTEN_IN_MAIL_TEXT`) go through the same extraction path?
- Is the local Llama good enough for interview tips, or does that part wait for the in-house model (see `ML_Phase_2.md`)?

Backend + frontend changes required:
- Gmail adapter: collect and download supported attachments, extend `InboundEmailMessage` (or a sibling DTO) with attachment text, and enforce MIME and size limits.
- Text extraction service with a clear failure state for unreadable files.
- Spec extraction service interface and implementation with its own prompt, schema validation and configuration (`more.ml.*`); event, dispatcher, processor and sweeper reusing the US-I10 mechanics.
- Flyway migration adding the spec `JSONB` column and extraction status/attempts columns on `interaction_events`, versioned per project convention.
- Expose the extracted spec through the existing interaction event DTOs, and map it in the frontend interaction service.
- Deterministic skill matching utility with synonym map and unit tests; narrative generation step fed with the structured match.
- Frontend: a spec-driven fit section in the accordion (skill coverage, gaps with actions, interview tips, fit verdict with evidence) following the UX instructions, plus loading, error and unreadable-spec states.
- Unit tests for attachment filtering, text extraction failures, spec parsing and schema validation, prompt-injection handling, idempotent replay, skill matching and the frontend section states.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: US-I3, US-I10; US-I11 for per-opportunity scoping; candidate profile data source (open question)

#### US-I13: Candidate Replies From a Take Note Action
As a candidate  
I want the action button on a note to prepare the right reply to the recruiter  
So that I can act on "CV requested", "No movement" or "Interview time rejected" without writing the email from scratch

Acceptance Criteria:
- Each reply action opens a pre-filled draft addressed to the recruiter on the same thread, for these actions: `send-cv` (draft with the candidate's CV attached), `send-follow-up` (job spec promised, no movement, assessment result), `suggest-interview-times` (draft offering the candidate's availability), `confirm-deal-breakers` (draft asking about each stated deal breaker), `clarify-location` (draft asking whether remote or hybrid flexibility is possible), `clarify-compensation` (draft confirming the candidate's range), `request-feedback` (rejection, failed screening, passed interview date).
- The candidate always reviews and edits the draft before it is sent; nothing is sent automatically.
- The draft is a template filled from known facts (recruiter name, role, client company, stated deal breakers); it does not require the model.
- After an action is completed the note is re-evaluated from the next synced events, so it disappears when the recruiter's reply or the candidate's response is classified.
- If sending is not possible (no consent, provider error) the candidate sees a clear inline message and can copy the draft.

Design decisions (proposed, to be confirmed):
- The Gmail integration currently uses the `gmail.readonly` scope, which cannot create drafts or send mail. Options: (a) request an additional `gmail.compose` scope and create a draft in the candidate's Gmail, (b) request `gmail.send` and send from the platform, (c) open a `mailto:` link with the template and send nothing from the platform. Option (c) needs no new consent; (a) and (b) need a consent change and a security review.
- Action handling is a single dispatcher keyed by `CandidateNoteActionId` so new actions do not change the template or the note builder.
- The candidate CV for `send-cv` depends on the profile data source decision in US-I12.

Open questions (not yet decided):
- Which of the three sending options is acceptable (consent and privacy)?
- Should the candidate be able to edit the templates?
- Does the platform record that an action was taken so the note can show "Sent" until the recruiter replies?

Backend + frontend changes required:
- Frontend action dispatcher, draft templates, and a review dialog (Angular Material dialog, single task, focus trap).
- Backend draft or send endpoint only if option (a) or (b) is chosen, with consent and scope handling.
- Unit tests for template filling, dispatcher routing, and note re-evaluation after sync.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: Take note panel, US-I10 (facts for templates), Gmail scope decision, US-I12 (CV data source)

#### US-I14: Candidate Adds Interview and Assessment Times to Their Calendar
As a candidate  
I want the action on an interview or assessment note to put the date in my calendar  
So that I do not miss it

Acceptance Criteria:
- `add-to-calendar` creates a calendar entry for the extracted interview date with role, client company and recruiter as context, offered as a downloadable `.ics` file (and optionally a calendar deep link).
- `confirm-interview-date` opens a reply draft (see US-I13) asking the recruiter to confirm the date and time when none was captured.
- `plan-assessment` lets the candidate pick a time block to complete the assessment and adds it to their calendar.
- Unparseable interview dates do not offer `add-to-calendar`; the candidate is offered `confirm-interview-date` instead.
- Time zones are explicit in the entry; no calendar data is stored by the platform.

Open questions (not yet decided):
- Is an `.ics` download enough for v1, or is direct calendar integration (and its consent) wanted?
- Does the extraction capture time and time zone, or only a date? The current `interviewDate` is a free-text string.

Backend + frontend changes required:
- Frontend `.ics` generation utility and date parsing with time zone handling.
- Possibly extend the extraction to return a structured date and time (see US-I10 extraction contract).
- Unit tests for `.ics` output, unparseable dates and time zones.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: Take note panel, US-I10 (interview date), US-I13 (confirm-date draft)

#### US-I15: Candidate Prepares for the Next Stage From a Take Note Action
As a candidate  
I want the "Coming up" notes to help me get ready for screening, interviews and a possible offer  
So that I answer quickly and consistently when the next stage arrives

Acceptance Criteria:
- `prepare-screening-answers` lets the candidate record their salary range, notice period, location and work-mode preference once and reuse them across threads.
- The "Interviews likely next" note has no action: an interview has not been proposed yet, so there is nothing to reply to. Saved availability is used by `suggest-interview-times` once a time is proposed and rejected.
- `prepare-offer-targets` lets the candidate record target compensation and earliest start date, reused when an offer or compensation question arrives.
- Saved preferences are compared with the stated terms and deal breakers of each opportunity so mismatches are flagged before the screening call.
- Preferences are editable at any time and are never shared with a recruiter automatically.

Open questions (not yet decided):
- Where do these preferences live (Living CV, candidate profile, or a new preferences area)? This overlaps the US-I12 profile data source question.
- Are preferences per candidate or per opportunity?

Backend + frontend changes required:
- Candidate preferences model and storage (check existing profile and Living CV tables before adding any), plus API and form (reactive form with inline validation).
- Comparison of preferences with `OpportunityFacts` using deterministic rules.
- Unit tests for preference mismatch rules and form validation.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: Take note panel, US-I10 (facts), US-I12 (profile data source), US-I13 (availability draft)

## 11.3 Completion Matrix Tracker
| Story | Focus | Sprint | Dependencies | Estimated Effort | Status |
|---|---|---|---|---|---|
| US-I1 | Opportunity Snapshot | 1 | Thread selection state | 0.5 sprint | Completed |
| US-I2 | Stage Tracker + Confidence + Next Unlock | 1 | US-I1 | 1 sprint | Completed |
| US-I3 | Job Spec Intelligence + Fit Checklist | 2 | US-I2 | 1 sprint | Completed |
| US-I4 | Top 3 Candidate Action Plan | 2 | US-I2, US-I3 | 0.5 sprint | Completed |
| US-I5 | Risk and Bottleneck Panel | 3 | US-I4 | 0.5 sprint | Completed |
| US-I6 | Multi-Event Signal Fusion | 3 | Event model with additionalEventTypes | 1 sprint | Completed |
| US-I7 | Admin Timeline Non-Regression | 4 | Existing role mode split | 0.5 sprint | Completed |
| US-I8 | Admin Compact Timeline Toggle (Optional) | 4 | US-I7 | 0.5 sprint | Completed |
| US-I9 | Deterministic Test Coverage | 4 | US-I2-US-I8 | 1 sprint | Completed |
| US-I10 | Client opportunity metadata extraction from recruiter email | Follow-up | US-I1, US-I6 | 1 sprint | Completed (pending commit) |
| US-I11 | Multi-opportunity display and per-opportunity intelligence | Unscheduled | US-I10 | TBD | Backlog |
| US-I12 | Job spec attachment intelligence and candidate profile fit | Unscheduled | US-I3, US-I10, US-I11 | TBD | Backlog |
| US-I13 | Take Note reply actions (send CV, follow-up, suggest times, feedback) | Unscheduled | Take note panel, US-I10, Gmail scope decision | TBD | Backlog |
| US-I14 | Take Note calendar actions (add interview, plan assessment) | Unscheduled | Take note panel, US-I10, US-I13 | TBD | Backlog |
| US-I15 | Take Note preparation actions (screening answers, availability, offer targets) | Unscheduled | Take note panel, US-I12, US-I13 | TBD | Backlog |

## 11.4 Story Delivery Notes
- Recommended implementation path for Phase 1 completion: US-I1 -> US-I2 -> US-I6 -> US-I3 -> US-I4 -> US-I5 -> US-I7 -> US-I8 -> US-I9.
- US-I10 is the explicit follow-on story for actual client-company and opportunity metadata extraction from recruiter email content. It includes backend extraction, persistence, and company linking, not only frontend mapping.
- US-I10 implementation notes:
  - Backend: Flyway `V20261015_120000__add_opportunity_extraction_to_interaction_events` adds `extracted_opportunities` (JSONB), `opportunity_extraction_status` and `opportunity_extraction_attempts` to `interaction_events`. `EmailProcessorTransactional` marks recruiter-sent events PENDING and publishes `OpportunityExtractionRequested`; `OpportunityExtractionDispatcher` runs the `OpportunityExtractionProcessor` after commit on its own bounded executor; `OpportunityExtractionSweeper` retries PENDING/FAILED events. `LocalLlamaOpportunityExtractionService` uses its own prompt (`ml/local-llama-opportunity-extraction-prompt.txt`); `ClientCompanyResolver` find-or-creates the client company (placeholder website unless the email stated a website that passes `ClientWebsitePolicy`).
  - Configuration: `more.ml.extraction.*` (enabled, model name, base URL, timeout, threads, queue capacity, max attempts, retry-after minutes, sweep batch size). Model name, base URL and timeout fall back to the `more.ml.*` values when unset.
  - Extraction uses the newest message of the event only (no thread context yet). An extracted company equal to the recruiter's own company is dropped and only the role is kept.
  - Frontend: `mergeOpportunities` (`interactions/utils/opportunity-merge.util.ts`) merges per-event opportunities by company and normalised title; the accordion header shows "Role at Company" (plus "+N more"), the overview heading and website link use the client opportunity, and extracted deal breakers appear as risk items and feed the "Deal breakers (N)" count.
  - The interim "+N more" header rule is implemented as designed but still unconfirmed (see the US-I11 open question).
  - "Visit company website" only ever uses the primary client opportunity's verified website. There is no fallback to the recruiter company (the former hard-coded Aesglobal lookup was removed); when the client site is unknown the link is hidden.
  - Merge rule for unknown clients: when a mention names no company (or the existing opportunity names none) it joins an existing opportunity only if exactly one has a compatible title (equal or missing); ambiguity keeps them apart. This stops a role stated in one email and its client named in the next from being counted as two opportunities ("+1 more").
- US-I11 is a backlog idea raised while designing US-I10 (threads that pitch several roles or companies). It is not scheduled and needs design discussion first.
- US-I12 is a backlog idea for reading job spec attachments from Gmail and mapping them to the candidate profile. Today the Gmail adapter reads only text parts, so attachments are ignored and `JOB_SPEC_ATTACHED` is inferred from the email text. It is not scheduled and needs design discussion first (profile data source, fit verdict policy, retention).
- US-I13 to US-I15 define the behaviour behind the Take note action buttons. The buttons and their stable ids (`CandidateNoteActionId` in `utils/candidate-notes.util.ts`) already exist in the UI, but clicking them does nothing yet. US-I13 first needs a decision on Gmail scope (the current `gmail.readonly` scope cannot create drafts or send mail).
- US-I8 remains optional and should be enabled only if admin testing volume justifies compact density mode.
- Keep role-scoped gating and centralized feature-flag conventions unchanged while implementing these stories.
