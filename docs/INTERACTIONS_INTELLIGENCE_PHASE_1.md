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
- Each node shows the first time that stage appeared in the thread and a count for repeated events that contributed to it. Passed stages use a solid dot with a "✓" chip; a passed stage with no classified events shows an inferred date window (italic, with tooltip) or "Completed".
- On landing in candidate mode every thread is collapsed and none is selected or marked read; a thread opens only when the user expands it. Admin mode still auto-selects the newest thread because its detail panel needs a selection.
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

## 5.6 Home Totals and Navigation
Home totals use the inferred stage (`interactions/utils/thread-stage.util.ts`), not the backend `status`, which stays NEW for synced threads until explicitly closed (`interactions/utils/interaction-summary.util.ts`):
- Active Interactions: status is not CLOSED and the stage is not Decision.
- New Opportunities: active threads still at Contacted. A thread leaves this count when any Qualified, Interviewing or Decision signal appears (see 5.2); it then stays in Active until a Decision signal or an explicit close.
- Recruiters: distinct `participantId` values across all threads.

Navigation: applicants and recruiters get an "Interactions" section in the nav drawer, and a matching list under Interactions in the home sidebar, with Analytics, Leads, My Recruiters / My Candidates and Reconnect (`shared/navigation/interactions-nav.ts`, same order as the Interactions side rail). The mailbox page (`/interactions/email-sync`, titled "Discover Leads") is no longer a nav entry; it is opened from the "Discover Leads" button in the Leads page header. The route name is kept because the Gmail OAuth return and deep links use it. The `interactionsEventsEnabled` flag only hides these links for admins, mirroring `InteractionsAccessGuard`.

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

> **Note: status in `RECRUITMENT_PHASE1_PLAN_FOUNDATION.md`.** Completed markers in the Recruitment Phase 1 plan (for example US 1.1 to 1.3, US 1.3a, US 1.4) describe only the scope of those stories as originally written. They do not mean that the Interactions work that touches the same features (for example the Living CV section in US-I12, or interest and application events in US-I16 and US-I17) is done or unnecessary. Status for every Interactions story is tracked only in the matrix below. Before implementing a story that depends on a Recruitment story, check the actual code and migrations rather than relying on the completed marker.

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

#### US-I12: Candidate Gets Job Spec Intelligence and Profile Fit
As a candidate  
I want a job spec, whether I upload it myself or a recruiter attaches it, to be read and compared with my profile, and the skill gaps and deal breakers that keep recurring across my opportunities to be gathered for me  
So that I see my skill coverage, gaps, interview tips and an evidence-backed fit verdict before I respond, and so that my Living CV shows me which weaknesses to work on and where to focus

This story is delivered as four stories that share one analysis pipeline. They differ in how the job spec arrives and in what is done with the extracted spec.

| Story | Scope |
|---|---|
| US-I12a | Analysis foundation and manual upload: safe parse, redaction, extraction, validation, grounding, status and polling, and a structured read of the spec |
| US-I12b | Profile fit: deterministic matching, gaps, interview tips, fit verdict, and candidate correction of the extracted spec |
| US-I12c | Gmail attachments: job specs attached to recruiter emails run through the same pipeline automatically |
| US-I12d | Living CV "Weaknesses and focus areas", aggregated from the candidate's interactions (does not need a spec to be uploaded) |

The aim is intelligence, not document storage. In none of the stories is the document or its text stored: the file is read in memory, and only derived data is kept.

##### Shared design (US-I12a to US-I12c)

**Data classification.** Job specs are mostly generic role facts (skills, years, seniority, responsibilities, stack), which are not personal information. The real exposure is elsewhere: the link between a candidate and the roles they pursue (covered by owner-only access), incidental personal data such as recruiter names or phone numbers in headers and footers, wrong documents (for example a CV), and cross-border transfer (avoided by keeping the model local). Recruiter email bodies are already stored in `interaction_events.message_body`, so this story deliberately stores less than that.

| Kept | Never kept |
|---|---|
| Structured spec: title, seniority, required and nice-to-have skills, years, certifications, tech stack, paraphrased responsibilities, salary and location when stated | The file (no file store, no database blob, no temporary file) |
| One short evidence snippet per extracted item (redacted, length capped, for example 200 characters) | The document text, redacted or not |
| Text hash, model name, prompt version, schema version, status, attempts, timestamps | Contact names, emails, phone numbers, ID numbers |

**Pipeline.** Each stage is a plain interface that can be faked in tests:

```
upload or attachment -> safe parse -> redact -> extract (one LLM call, also classifies the document)
-> schema validate -> grounding check -> derived spec (draft) -> [US-I12b] deterministic match -> fit
```

- **Safe parse.** PDFBox for PDF and POI for DOCX, plain read for TXT. We enforce our own limits before and during parsing: MIME check on file content (magic number) and not only the extension, size cap, page cap, archive-entry and decompression limits, and a parse timeout. Parsing runs on its own small pool, separate from the model pool, so a hostile file cannot starve model calls. OCR, hosted parsers (for example LlamaParse) and parser sandboxing are out of scope for v1.
- **Redact.** Emails, phone numbers and ID-number patterns are removed from the text before the model call and from every stored snippet.
- **Extract.** One call to the local Ollama model, using Ollama's JSON schema constrained output. The schema has no field for names, emails or phone numbers, free-text fields are instructed to paraphrase, and a deterministic scan drops any extracted value that looks like an email, phone number or URL. The same call returns a document type (`JOB_SPEC` or `NOT_A_JOB_SPEC`, with a short reason), so no extra call is needed to detect a wrong document.
- **Validate.** Model output is validated against the schema before it is stored or shown. Attachment text is untrusted and cannot change the model instructions.
- **Grounding check.** Instead of trusting model confidence scores, each extracted item is checked deterministically against the source text (for example that the skill or the year count actually appears). Items that cannot be found carry no evidence snippet and are shown as "verify this".

**LLM integration.** LangChain4j (Ollama module and AI Services) is used for the new extraction only, behind our own `JobSpecExtractionService` interface, so the rest of the code is not coupled to the framework. The existing `LocalLlama*` classes are not changed. Spring AI is not added. A deterministic fake implementation is used in dev and CI; vLLM, an OpenAI-compatible server or AWS Bedrock would be further implementations of the interface (Phase 2, and only after a privacy and legal decision).

**Analysis table and queue.** A new `job_spec_analysis` table holds one row per analysis: scope (`scope_type` of `INTERACTION` or `JOB_AD`, with the scope id), owner (the uploading or mailbox-owning user), origin (`JOB_AD`, `RECRUITER_UPLOAD`, `EMAIL_ATTACHMENT` or `CANDIDATE_UPLOAD`), source reference (Gmail message and attachment ids only for Gmail), status (PENDING, DONE, FAILED), attempts, failure reason code, content hash (SHA-256 of the file bytes, computed in memory), text hash, model name, prompt version, schema version, the derived spec as `JSONB`, a superseded marker, and timestamps. A candidate's edits are not stored here (see US-I12b). Check existing migrations first.
- Manual uploads (US-I12a) run directly on a bounded executor, with the text held in memory only by the in-flight task. They are prioritised over Gmail work.
- Gmail rows (US-I12c) are claimed by a worker with `FOR UPDATE SKIP LOCKED`, so several API instances can share the work and a restart loses nothing, because a retry re-fetches the attachment.
- Access goes through a small `JobSpecAnalysisQueue` interface (enqueue, claim, complete, fail). No message broker is added: the model, not the queue, is the bottleneck, a Postgres claim query handles far more than the model can process, and enqueueing in the same transaction as the status row avoids the dual-write problem. If several consumers, separate worker deployments or sustained queue depth appear, an SQS implementation replaces the Postgres one behind the same interface.
- If the same candidate re-analyses identical text (same text hash, model, prompt version and schema version), the stored derived spec is reused and the model call is skipped. Reuse across different candidates is not done in v1.

**Ownership, authority and idempotency (proposed, to be confirmed).** The source of truth for a role's spec is the recruiter side (the job ad, a recruiter upload, or the spec the recruiter emailed), not the candidate. The candidate can still upload, because many specs arrive outside the platform, but that copy has the lowest authority.
- **Who can upload where.** A mailbox thread belongs to the mailbox owner, so access follows ownership and nobody gets access to the other party's mailbox thread.

  | Scope | Candidate upload | Recruiter upload |
  |---|---|---|
  | Job ad (`JOB_AD`) | No | Yes. Analysed once and shared by every candidate who interacts with the ad (see US-R7) |
  | Candidate's own interaction | Yes, as a private lowest-authority copy | No (the recruiter's spec reaches the candidate through the job ad or the email attachment, US-I12c) |
  | Recruiter's own interaction (platform-native, or from the recruiter's own mailbox once US 1.4a exists) | n/a | Yes |
- **Precedence (effective spec).** Job ad, then recruiter-origin (recruiter upload or email attachment), then candidate upload. Within the same tier the latest wins. The effective spec is chosen at read time by origin, so a lower tier never blocks or deletes a higher one, and the candidate's private copy is used only when no higher tier exists.
- **Idempotency.**
  - Uploads carry a client-generated `Idempotency-Key`; a repeated key returns the existing row instead of a second analysis.
  - A repeated upload of the same content (same content hash) for the same scope and origin returns the existing result and skips the model call.
  - A partial unique index allows one active (non-superseded) row per scope and origin; a newer upload marks the previous one superseded in the same transaction.
  - Gmail rows are unique on owner, Gmail message id and attachment id, so a sync replay or sweeper retry cannot create a duplicate.
- **Separate records per party.** The recruiter's and the candidate's interactions are separate rows, so an upload on one never locks the other. Linking them is a later enhancement (see the engagement link note in US-I16): until it exists the candidate only receives a recruiter's spec through the job ad or their own email attachment.

**Operations and testing.**
- Micrometer metrics: queue depth, per-stage latency, failure rate by reason, model call duration, and reuse rate. No document text in logs or metrics.
- Ollama concurrency (`OLLAMA_NUM_PARALLEL`, `OLLAMA_MAX_QUEUE`) and the extraction thread count are documented configuration for ops.
- Golden-set fixtures: synthetic job spec texts with expected extractions run against the fake provider in CI. A separate tagged suite runs them against a real Ollama model when a prompt or model changes.
- Deferred scope (LLM narrative, cloud and vLLM providers, OCR, circuit breaker, broker, NER redaction, growth pathways, demand signals) is tracked in section 11 of `INTERACTIONS_INTELLIGENCE_PHASE_2_PRODUCTION_SCALE.md`.

#### US-I12a: Candidate Uploads a Job Spec and Gets a Structured Read
As a candidate  
I want to upload a job spec and have it read into a structured summary  
So that I can see what the role actually requires, with a pointer to where each item came from

This is the foundation story: it builds the shared pipeline, the `job_spec_analysis` table, status and polling, and the manual upload path.

The candidate uploads a job spec document themselves, for specs that did not arrive as an email attachment (for example a link, a LinkedIn message, a shared drive file, or an interaction that started on the platform, see US-I16).

Acceptance Criteria:
- On an expanded opportunity the candidate can upload a job spec (PDF, DOCX, TXT) with a file upload control.
- The file is read in memory and converted to text. The document and its text are never saved (no file store, no database blob, no temporary file left behind) and the text is not logged. Only the derived structured spec with short evidence snippets is stored, as described in the shared design.
- The text is redacted and sent to the model in one extraction call that also classifies the document. A document that is not a job spec (for example a CV or an unrelated file) is rejected with "This doesn't look like a job spec" and a retry option, the same way non-recruiter emails are rejected. A deterministic backup rejects a result that has neither a title nor any skills.
- The extracted spec is validated against the schema and every item is grounded against the source text. The candidate sees the spec as a read-only draft labelled "AI-read, please check", with the evidence snippet next to each item. Items with no evidence are highlighted as "verify this". Editing items and the fit verdict are part of US-I12b.
- The structured extraction is the same whether the spec arrived by upload (this story) or as an email attachment (US-I12c), so the result looks the same however the spec arrived. The same untrusted-text and schema validation rules apply.
- Unsupported types, oversized files and unreadable files (for example scanned PDFs) show a clear inline message with a retry option, never a silent failure.
- Upload is send and forget: the candidate does not wait for the analysis. As soon as the upload is accepted the section shows an inline "Job Spec being analyzed" message and the candidate can keep using the page.
- The frontend polls for completion every 1 minute while the analysis is PENDING. Polling stops as soon as the status is DONE or FAILED, and also when the candidate leaves the page or the opportunity is no longer shown. Polling never runs when nothing is pending.
- When the analysis completes the structured spec section (and the fit section once US-I12b is live) updates in place with a short inline success state. A FAILED result shows the inline error with a retry option (retry uploads again).
- If the page is reloaded or reopened while an analysis is still PENDING, the "being analyzed" message is shown again and polling resumes, because the status comes from the server and not from browser state.
- Polling is capped (for example 30 minutes). After the cap the section shows "Analysis is taking longer than expected" with a manual refresh action instead of polling forever.
- The upload belongs to a specific opportunity (the primary opportunity until US-I11 is decided). A newer candidate upload supersedes the candidate's previous one for that opportunity. It never overrides a recruiter-origin spec (job ad, recruiter upload or email attachment); precedence and idempotency (idempotency key, content hash, one active row per scope and origin) follow the shared design.
- The candidate can remove the derived spec data for an opportunity.
- Only the owning candidate can upload to, read or remove the data of their own interactions.
- A spec from any source feeds the "Weaknesses and focus areas" aggregation (US-I12d) in the same way.

Design decisions (proposed, to be confirmed):
- A candidate-scoped multipart upload endpoint. The stream is processed in memory with a size cap, a MIME allow-list checked on file content and not only the extension, and page and archive-entry limits to guard against oversized or decompression-bomb files. Uploads are rate limited.
- It uses the shared pipeline (safe parse, redaction, extraction, validation, grounding) and the `job_spec_analysis` status row. The request returns `202 Accepted` with the PENDING status once the upload is accepted, and the analysis runs on a bounded executor so a slow local model call does not hold the HTTP request open. The file bytes are held in memory only until the text is extracted, and the text is held only by the in-flight task. Because nothing is persisted, a retry by the sweeper is not possible and the candidate retries by uploading again.
- Completion is read by polling a lightweight, candidate-scoped status read (opportunity spec status: PENDING, DONE, FAILED, plus the derived spec when DONE) every 1 minute, rather than reloading all threads. A push channel (SSE or WebSocket) was considered and rejected for now because a 1-minute poll is enough for a send-and-forget flow.
- The derived spec is stored as `JSONB` on the `job_spec_analysis` row, linked to the interaction event and opportunity. A manual upload has no recruiter email behind it, so the row itself is the record of the upload and it creates no stage signal on its own. Check existing migrations first.
- This story needs no Gmail scope or adapter changes, so it can ship before US-I12c and also works for platform-originated interactions.
- Frontend: PrimeNG file upload (the UI guidance reserves PrimeNG for file upload), with the upload sent through a service, plus analyzing, error and retry states. The polling lives in the service (an RxJS timer every 60 seconds, switched to the status read, completed with `takeWhile` on the PENDING status and torn down with `takeUntilDestroyed()`), and the component only reads a signal. Only one poll runs per opportunity, and a new upload replaces the running poll.
- Because the extracted text is held only in the in-flight background task, a server restart while PENDING loses the task. The sweeper marks such stale PENDING items FAILED after a timeout so the candidate sees the retry state instead of waiting indefinitely.

Open questions (not yet decided):
- Does a manual upload count as a stage signal such as `JOB_SPEC_ATTACHED`, or stay purely informational?
- If an uploaded spec differs from a spec that arrived by email for the same opportunity, does the latest win, or are both kept? (Proposed: the precedence and idempotency rules in the shared design. A candidate upload never overrides a recruiter-origin spec, and the candidate's edits apply to the spec they were made on.)
- Should a candidate upload be allowed at all when the source of truth is the recruiter or the email? (Proposed: yes, as a private lowest-authority copy, because many specs arrive outside the platform.)
- Can a candidate upload a spec for a role that has no interaction yet (for example a role found elsewhere)?
- Is a 1-minute poll acceptable for a typical analysis time on the local model, or should the first check come sooner (for example after 15 seconds) and then settle at 1 minute?

Backend + frontend changes required:
- Backend: multipart upload endpoint (DTO records, validation, ownership checks), in-memory handling with no persistence of the file or text, and the shared analysis pipeline behind the `JobSpecExtractionService` and `JobSpecAnalysisQueue` interfaces (LangChain4j Ollama implementation plus a deterministic fake). Flyway migration for `job_spec_analysis`, versioned per project convention.
- Backend: `202 Accepted` upload response, a candidate-scoped spec status read for polling, and stale PENDING handling in the sweeper.
- Frontend: upload control and the structured spec section states (analyzing, not a job spec, unreadable, error, retry, replace, remove, taking longer than expected, verify-this highlighting with evidence snippets), plus the 1-minute completion poll in the service.
- Unit tests for MIME and size validation, no file or text persistence, unreadable files, not-a-job-spec rejection, redaction (emails, phones, ID numbers, snippets), contact-value scan on extracted fields, grounding (evidence found and not found), replace and remove, ownership and role checks, and the frontend upload states.
- Golden-set extraction fixtures against the fake provider, and a content-hash reuse test (identical text, model, prompt and schema version skips the model call).
- Unit tests for polling: it starts after an accepted upload, repeats every 60 seconds (fake timer), stops on DONE and on FAILED, stops on component destroy, resumes for an already PENDING spec on load, does not start when nothing is pending, is replaced by a new upload, and stops at the cap.

#### US-I12b: Candidate Sees Profile Fit and Corrects the Extracted Spec
As a candidate  
I want my profile compared with the extracted job spec, and to fix anything the AI got wrong  
So that I see my skill coverage, gaps, interview tips and an evidence-backed fit verdict that I can trust before I respond

Acceptance Criteria:
- Each required skill is mapped against the candidate's profile as strong, partial or missing, using deterministic matching (including a synonym map such as "Spring Boot" vs "Spring"), not model judgement.
- The candidate sees gaps with a suggested action for each, interview preparation tips tied to the spec, and a fit verdict (for example Strong, Partial, Weak) with the evidence behind it (for example "requires 5y Java, your profile shows 3y").
- Gap explanations, interview tips and the fit summary are templated text keyed to the structured match result in v1. No second model call is made and the model never sees the candidate profile. An LLM-written narrative is deferred to Phase 2.
- The candidate can edit or remove any extracted item (skill, years, seniority, certification) and add one that was missed. Edits persist, override the extraction, recompute the match, and are not overwritten by a re-analysis. Review is optional and never blocks the fit section.
- Edits are stored as a per-candidate overlay (for example a `candidate_job_spec_override` table keyed by candidate and analysis), not on the analysis row. This keeps a spec shared by many candidates (a job-ad spec) read-only for everyone, so one candidate's edits never change another candidate's view. The match is computed from the effective spec plus the candidate's overlay.
- The fit section appears as soon as the draft is ready, labelled "AI-read, please check" until the candidate has edited or confirmed it, with ungrounded items highlighted.
- The section replaces the signal-only skills and role fit rows from US-I3 when a spec has been analysed; without a spec it falls back to the US-I3 behaviour.
- The spec, match result and edits are visible only to the owning candidate.

#### US-I12c: Job Spec Attachments on Recruiter Emails Are Read Automatically
As a candidate  
I want the job spec a recruiter attaches to an email to be read without me uploading it  
So that my fit and gaps are ready when I open the opportunity

Acceptance Criteria:
- Job spec attachments (PDF, DOCX, TXT) on recruiter emails are fetched and run through the same pipeline as a manual upload (US-I12a); unsupported, oversized or unreadable files show a clear "couldn't read this spec" state instead of failing silently.
- Email sync is never blocked or failed by attachment analysis. A PENDING `job_spec_analysis` row is created after the event commits and picked up asynchronously.
- The row stores the Gmail message and attachment ids, never the content, so a retry re-fetches the attachment and a server restart loses nothing.
- Attachment text is treated as untrusted data: it cannot alter model instructions, and model output is validated against a schema before it is stored or shown.
- A recruiter attachment that is not a job spec (for example a signature image or a CV of someone else) is classified as such and ignored without an error shown to the candidate.
- Document text is not logged, and only derived data is stored.

#### US-I12d: Candidate Sees Weaknesses and Focus Areas on the Living CV
As a candidate  
I want the skill gaps and deal breakers that keep recurring across my opportunities gathered in one place  
So that my Living CV shows me which weaknesses to work on and where to focus

Acceptance Criteria (weaknesses and focus areas for the Living CV):
- The candidate-side skill gaps and deal breakers of all of the candidate's interaction opportunities are gathered into one aggregated list per candidate. Sources: `SKILLS_GAP` and `SKILLS_INQUIRY` signals, required skills from the extracted opportunity facts and job spec that the candidate's profile does not cover (strong/partial/missing from the matching above), and extracted deal breakers the candidate cannot currently meet (including those behind `LOCATION_BOTTLENECK`, `COMPENSATION_BOTTLENECK`, visa and notice period constraints).
- "Candidate side" means items about what the candidate lacks or cannot meet. Recruiter or company-side deal breakers that are not about the candidate (for example a stated role requirement the candidate already satisfies) are excluded.
- Entries are deduplicated by a normalised skill or deal-breaker key (reusing the synonym map) and carry evidence: the number of opportunities that raised it, the most recent occurrence, the severity (blocked a process, raised as a concern, listed only) and the opportunity titles for the candidate's own reference.
- Entries are ranked by impact: items that blocked or ended a process first, then by how many opportunities raised them, then by recency. Closed threads still count as evidence, but a gap the candidate has since closed (skill added to the Living CV or a verified milestone) is shown as resolved instead of being dropped silently.
- The Living CV gets a "Weaknesses and focus areas" section with two groups: skill gaps and deal breakers. Each entry shows the name, how often it came up, and a suggested focus action that links to an existing Living CV or career-development flow (add a skill, start a goal, take a challenge or assessment, add a certification, or update location, salary or notice period preferences).
- The section is private to the candidate. It never appears in recruiter views, the public Living CV, the candidate pool or exports, and recruiter, company and email text are not shown in it.
- With no interaction data the section shows a guided empty state (what feeds it and how to get started) instead of staying blank, and shows inline loading and retry states.
- The candidate can dismiss an entry or mark it as not relevant, and the choice persists and is not re-added by later syncs unless the evidence changes.
- Aggregation is deterministic and testable; the model is not used to decide what counts as a gap or a deal breaker.

Design decisions (proposed, to be confirmed) for US-I12b to US-I12d, in addition to the shared design above:
- Gmail access: the existing `gmail.readonly` scope already allows downloading attachments, so no new consent is needed. `GmailInboundEmailSourceAdapter` currently reads only text parts, so it must also collect parts with a filename and `body.attachmentId` and fetch them through the Gmail attachments API, with a MIME allow-list and a size cap.
- Text extraction happens server-side with PDFBox and POI (see the shared design). The model never receives raw files. OCR is out of scope for v1.
- Spec analysis is event-driven, following the US-I10 pattern for the trigger (after-commit event, bounded executor, attempts counter and a sweeper) but with its own `job_spec_analysis` table and Postgres-backed queue described in the shared design, so email sync is never blocked or failed.
- The extracted spec is stored as `JSONB` on the `job_spec_analysis` row (derived data and evidence snippets only, no attachment bytes and no text). Check existing migrations first; a new table is expected here.
- Matching is deterministic and testable; the model is used only for extraction in v1. This keeps results stable and auditable and works with a small local Llama.
- Long specs are truncated or chunked to fit the model context; the request timeout and executor limits follow the `more.ml.*` configuration.
- Privacy: see the data classification in the shared design. Keep processing on the local model, never log document content, store only derived data and redacted evidence snippets, and expose the spec only to the owning candidate. Specs never feed cross-candidate analytics as text; only de-identified derived facts may do so, and only in a later story.
- A spec belongs to a specific opportunity, so this story depends on how US-I11 scopes opportunities within a thread. Until US-I11 is decided, attach the spec to the primary opportunity.
- Weaknesses and focus areas: the Living CV page does not load interaction threads, and only the candidate's own threads are visible to them, so the aggregation should be a backend read model rather than a frontend merge of full threads. Proposed endpoint: a candidate-scoped read (for example `GET /api/candidates/me/interaction-insights`) returning `{ skillGaps[], dealBreakers[] }` with key, label, occurrences, last seen, severity and resolved flag. It is derived from the per-event `JSONB` extractions (US-I10) and from the derived specs on `job_spec_analysis` (this story), so no new extraction pipeline is needed. Check existing migrations first; a table is only needed for the dismissed or not-relevant choices, and for the aggregate itself if read cost requires caching.
- The aggregation, normalisation and ranking rules live in one deterministic utility or service shared with the skill matching, so the Interactions fit rows and the Living CV section never disagree about what a gap is.
- Gap resolution is evaluated against the same candidate profile source as the skill matching, so a skill that is added to the Living CV moves to resolved on the next read.
- Privacy: this is personal development data. It is exposed only to the owning candidate (role and ownership checks on the endpoint), is excluded from every recruiter-facing Living CV, candidate search and export path, and follows the same retention rule as the extracted spec data.
- Frontend: follows the Living CV UX patterns (progressive disclosure, guided empty state, inline feedback and recovery, semantic status tokens, differentiated container for a ranked focus list rather than repeating card shells). Sibling to the Market Readiness diagnostic pattern: current status first, what drives it, then the highest-impact next action.

Open questions (not yet decided):
- Which candidate data is the source of truth for skills and years of experience (Living CV, profile, or an uploaded CV)? This also decides how gaps are marked as resolved.
- Should the focus areas also feed Market Readiness scoring (for example as suggested next steps) or the career pathway, or stay informational on the Living CV only?
- Should a gap be counted once per opportunity or once per recruiter or company, so one recruiter pitching five similar roles does not inflate the ranking?
- How long does evidence stay relevant (for example only the last 6 or 12 months), and should stale items fade out?
- Which deal breakers are candidate-side, and which are preferences the candidate chooses to keep (for example a location the candidate will not move to)? Those may belong in preferences (US-I15) rather than as weaknesses.
- Is a fit verdict acceptable for candidates, or should the section show coverage and gaps only?
- Which file types and size cap are supported in v1? (Retention of the document is not an issue because it is not kept; retention of the derived spec follows the interaction.)
- Should specs pasted into the email body (`JOB_SPEC_WRITTEN_IN_MAIL_TEXT`) go through the same extraction path?
- Should identical specs be reused across different candidates (a cache hit skips the model), given that the derived spec and snippets then originate from another candidate's upload? v1 reuses only within the same candidate.
- Should the Information Officer confirm the POPIA position (derived facts and redacted snippets, local processing) before US-I12c ships, since it reads third-party recruiter attachments automatically?

Backend + frontend changes required:
- Gmail adapter: collect and download supported attachments, extend `InboundEmailMessage` (or a sibling DTO) with attachment text, and enforce MIME and size limits.
- Text extraction service (PDFBox and POI with our own limits) with a clear failure state for unreadable files.
- Spec extraction service interface and LangChain4j Ollama implementation with its own prompt, schema validation, redaction, grounding and configuration (`more.ml.*`); an after-commit event, the `job_spec_analysis` table, a Postgres-backed queue and a sweeper (see the shared design).
- Flyway migration for the `job_spec_analysis` table (scope, origin, content hash, superseded marker and the partial unique indexes) and for the per-candidate override table used by US-I12b, versioned per project convention. Check whether the local sync reset script needs the new tables.
- Unit tests for precedence selection, idempotency key and content-hash replay, one-active-row-per-scope-and-origin, Gmail duplicate prevention, and that a candidate upload never overrides a recruiter-origin spec.
- Candidate-scoped read of the derived spec and its status for the frontend; no spec data added to recruiter-facing interaction DTOs.
- Deterministic skill matching utility with synonym map and unit tests; templated gap, tip and verdict text fed by the structured match.
- Frontend: a spec-driven fit section in the accordion (skill coverage, gaps with actions, interview tips, fit verdict with evidence, editable extracted items) following the UX instructions, plus loading, error and unreadable-spec states.
- Backend: interaction insights aggregation service and candidate-scoped endpoint (DTO records, mapper, ownership checks) that gathers skill gaps and candidate-side deal breakers across the candidate's interaction events, with dismissal persistence if a table is required (Flyway, versioned per project convention).
- Frontend: interaction insights service, models matching the DTOs, and a "Weaknesses and focus areas" section in the Living CV (`living-cv` feature) with focus-action links, empty, loading, error and retry states, and no exposure in recruiter-facing views.
- Unit tests for attachment filtering, text extraction failures, spec parsing and schema validation, prompt-injection handling, idempotent replay, skill matching and the frontend section states.
- Unit tests for aggregation: deduplication through the synonym map, candidate-side filtering, ranking, resolved-gap handling, dismissal persistence, ownership and role checks on the endpoint, and the Living CV section states and privacy (not rendered in recruiter views).

Phase: Backlog, needs design discussion before scheduling  
Dependencies: US-I12a first (foundation), then US-I12b and US-I12c in either order; US-I12d is independent of a spec being uploaded and can ship earlier. Recruiter uploads on a recruiter-owned interaction need the recruiter view (US-I16/US-I17 blockers) and, for the recruiter's own mailbox, US 1.4a; passing a recruiter-owned spec to a linked candidate interaction needs the engagement link described in US-I16, a later enhancement. Overall: US-I3, US-I10; US-I11 for per-opportunity scoping; candidate profile data source (open question); Living CV skills and goals (US 1.1 to 1.3) for the focus actions; US-I12a has no dependency on the Gmail adapter changes in US-I12c  
Note: US 1.1 to 1.3 are marked completed in `RECRUITMENT_PHASE1_PLAN_FOUNDATION.md`. That is only a dependency here: the "Weaknesses and focus areas" section is new work owned by this story, added to the existing Living CV page, and the Living CV is not being reopened or reimplemented.

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
- On platform-originated interactions (US-I16, US-I17) the same actions can be handled natively inside the platform, which needs no Gmail scope.

Open questions (not yet decided):
- Which of the three sending options is acceptable (consent and privacy)?
- Should the candidate be able to edit the templates?
- Does the platform record that an action was taken so the note can show "Sent" until the recruiter replies?

Backend + frontend changes required:
- Frontend action dispatcher, draft templates, and a review dialog (Angular Material dialog, single task, focus trap).
- Backend draft or send endpoint only if option (a) or (b) is chosen, with consent and scope handling.
- Unit tests for template filling, dispatcher routing, and note re-evaluation after sync.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: Take note panel, US-I10 (facts for templates), Gmail scope decision, US-I12b (CV data source)

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
Dependencies: Take note panel, US-I10 (facts), US-I12b (profile data source), US-I13 (availability draft)

### Epic: Platform-Originated Interactions

The stories above all start from a recruiter email. These two cover interactions that start on the platform: a recruiter posts a job ad (already supported), a candidate shows interest or applies, and that action is itself an interaction. The conversation may stay on the platform or move to email.

> **Note: blocker questions.** US-I16 and US-I17 must not be implemented until the questions marked **Blocker** under each story are answered. The stories below record the intent and the proposed design only.

#### US-I16: Platform-Originated Interaction From Job Interest or Application
As a candidate  
I want showing interest in, or applying to, a job ad on the platform to appear as an interaction with that recruiter  
So that every opportunity, whether it started by email or on the platform, is tracked in one place with the same stage, guidance and totals

Acceptance Criteria:
- When a candidate shows interest in or applies to a recruiter's job ad, an interaction is created for that candidate and recruiter, or the event is attached to an existing one (see the merge rule under the open questions). The first event is on the `MO_NATIVE` channel.
- The opportunity facts (role title, client company, location, work mode, salary, required skills) come from the job ad. No model extraction or classification is used for platform-originated events.
- Application status changes (for example applied, shortlisted, on hold, rejected) are recorded as events on the same interaction and mapped to the existing stage signals by a fixed, documented mapping (for example applied maps to `INTERESTED` and `CV_SUBMITTED`, rejected maps to `REJECTION`). The mapping is deterministic and unit tested.
- The interaction appears in the candidate's Interactions view, the stage rail, Take note and the home totals exactly like an email-originated one, with a channel indicator.
- The interaction links to the job ad and the application instead of copying their data. Changing the application status does not require a second update on the interaction.
- Recruiter-facing views keep respecting the candidate's public alias until identity is revealed under the existing rules.
- Interactions that only exist because of email are unaffected.

Design decisions (proposed, to be confirmed):
- `JobApplication` already holds the status, hold reason, recruiter notes and applied/status-change timestamps, so it stays the source of truth for the application state. The interaction derives its platform events from it (read-time derivation or events written from the existing status-change path) rather than keeping a second copy that can drift.
- `RecruiterInteraction` already allows a nullable recruiter and has external email fields, and each event carries its own channel, so one thread can hold platform and email events. The existing model is reused. A new table is not expected; check existing migrations first.
- The opportunity shown for a platform interaction is built from the job ad and fed to the same `OpportunityContext` contract as US-I10, so the accordion header, overview and fit rows need no separate path.
- A job interest is a lighter signal than an application. The proposed default is to create the interaction on interest or application and record the application as an event inside it.
- **Engagement link, shared facts versus private perspective, and the identity rule (design note, to be confirmed).** Today a `RecruiterInteraction` is candidate-owned (`applicant_id` is required, `recruiter_id` is nullable), and nothing links it to a recruiter-owned record (US 1.4a). If both sides keep independent records of the same opportunity, they can show different statuses.
  - Shared facts are written once and read by both sides: the job ad, the application status (`JobApplication` stays the source of truth) and agreed milestones such as an interview scheduled. A platform-held engagement key ties together the candidate record, the recruiter record, the job ad and the application, and carries only shared facts.
  - Private perspective stays on each owner's own record and is never merged into the other's view: notes, mailbox-inferred stage signals, classifier output and message content from the owner's mailbox.
  - A recruiter's view of a candidate shows the shared facts plus the recruiter's own events, not the candidate's stage signals or notes. One merged interaction holding both mailboxes' events is rejected because it would expose one party's inbox content to the other.
  - Identity rule: the link is made server-side and never exposes the candidate's email address or identity to the recruiter before reveal. Matching by email address is not used for the shared link, because a match would de-anonymise the alias. The recruiter sees "linked" and the shared facts only, and the match key is the job ad or application id.
  - This link is a later enhancement. US-I12 does not depend on it (a job-ad spec already reaches candidates through the job ad).

Open questions:
- **Blocker:** does an expressed interest alone create an interaction, or only a full application?
- **Blocker:** if the candidate already has an email thread with the same recruiter, do we merge the platform events into it, keep a separate interaction, or merge only when it is about the same job? What is the matching rule (recruiter, candidate, job ad, role title)? Proposed three-tier rule, in order of confidence:
  1. Platform-originated: linked at creation by the job ad and application id. No inference is needed.
  2. Email replies: matched by the `In-Reply-To` and `Message-ID` headers, or by a reply token the platform put in the first message.
  3. Heuristic (recruiter, candidate and role title): only a suggestion that needs confirmation, never an automatic link.
  When none applies, or the recruiter is external with no account, the two sides stay independent. That is expected, not an error.
- **Blocker:** engagement link, shared facts versus private perspective, and the identity rule (see the design note below). Without it a recruiter and a candidate could see different statuses for the same opportunity.
- **Blocker:** is the recruiter side in scope (a recruiter Interactions view of platform interactions), or is this candidate-side only for now?
- **Blocker:** what does the recruiter see before the candidate reveals their identity, and how does that apply to an interaction record and its events?
- Which application statuses map to which stage signals, and what happens to statuses with no matching signal (for example on hold)?
- Is an existing application backfilled into interactions, or only new ones from release (the US-I10 approach was no backfill)?
- Which interaction `status` does an application withdrawal or a job ad closure produce?

Backend + frontend changes required:
- Backend: creation or attachment of an interaction from the interest and application flows, status-change to event mapping, and exposure through the existing interaction DTOs with the channel (Flyway only if a link column is needed, versioned per project convention).
- Backend: opportunity facts from the job ad mapped into the existing extracted opportunity contract.
- Frontend: channel indicator on the thread and events, and no change to the stage, notes or totals logic beyond consuming the new events.
- Unit tests for the status-to-signal mapping, creation versus attachment, alias handling, and the home totals with a platform-originated interaction.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: Existing job ads, interest and application flows, US-I10 (opportunity contract), US-I6 (signal fusion)  
Note: in `RECRUITMENT_PHASE1_PLAN_FOUNDATION.md`, job ad creation (US-R1) and `JobApplication` exist, but US-R2 (matching) and US-C1 (interest under alias, interest tracking endpoints) are still pending. Do not assume an interest flow exists. Confirm in code what exists before starting, and agree the interest-status source of truth with US-C1 so this story does not build a second one. Interactions status for this story is tracked only in the matrix in section 11.

#### US-I17: Candidate and Recruiter Continue the Conversation on the Platform
As a candidate or recruiter  
I want to keep talking inside the platform after an interest or application, and have the conversation stay linked when it later moves to email  
So that I do not have to leave the platform to progress an opportunity, and nothing is lost if either side switches channel

Acceptance Criteria:
- A candidate and a recruiter can exchange messages on a platform-originated interaction. Each message is an event on the `MO_NATIVE` channel.
- Platform messages carry explicit, structured actions where possible (request CV, send CV, propose interview times, accept a time, ask a screening question, send feedback). Each action maps to a stage signal by a fixed mapping, so no classification model is needed for platform events.
- The Take note actions from US-I13 to US-I15 (send CV, suggest interview times, clarify location or compensation, request feedback) work natively on a platform interaction without any Gmail scope, and add events to the thread.
- When either party moves to email, later emails from that recruiter about the same opportunity attach to the same interaction instead of starting a second one, using the agreed matching rule from US-I16.
- The channel of each event is visible in the thread so the history reads as one conversation.
- Notifications tell the other party about a new platform message, and respect existing notification preferences.
- Candidate identity rules (public alias until revealed) apply to messages.
- Messages are not exposed to anyone other than the two parties and administrators with the existing access rules.

Design decisions (proposed, to be confirmed):
- Prefer explicit actions over free text for the first release. Actions give deterministic signals, avoid model cost and make the next-unlock logic exact. Free-text messages can be added next to them and shown as neutral `REPLY` events.
- Messages are stored as interaction events, not in a separate messaging model, so stage, notes, totals and the admin timeline keep working unchanged.
- Native actions remove the Gmail compose or send scope question for platform interactions, so US-I13 can ship native actions first and revisit email sending separately.
- Abuse and safety controls (rate limits, content limits, blocking, reporting) and a retention rule are part of this story, not an afterthought.

Open questions:
- **Blocker:** structured actions only, free text only, or both for the first release? Free text needs a decision on whether platform messages go through the classifier.
- **Blocker:** does the recruiter get an inbox and Interactions view in this story, or does it only update the candidate side? Messaging needs both parties.
- **Blocker:** when a candidate or recruiter moves to email, how is the matching to the existing interaction done reliably (reply-to address, subject token, recruiter and job ad), and what happens when it cannot be matched? Use the three-tier rule and the engagement link design note in US-I16, so both parties see the same shared facts and the identity rule holds.
- **Blocker:** when a message arrives in one party's mailbox, does it update only that party's own record plus the shared facts, and never the other party's record (see the US-I16 design note)?
- **Blocker:** what notification channels are used (in-app, email), and does a notification email count as an interaction event?
- Are attachments (CV, job spec) allowed in platform messages, and are they scanned and size limited? How does this relate to US-I12?
- What is the retention and deletion rule for platform messages?
- Can a recruiter message a candidate first on a platform interaction, or only reply to an interest or application?
- Are read receipts or typing indicators wanted, or out of scope?

Backend + frontend changes required:
- Backend: send and read message endpoints on an interaction, action-to-signal mapping, ownership and role checks, notification dispatch, rate limiting and retention (Flyway only if new columns are needed, versioned per project convention).
- Backend: email-to-interaction matching for later emails from a recruiter with an existing platform interaction.
- Frontend: conversation composer with structured actions (Angular Material dialog or panel, accessible), channel indicators, native handling of the Take note action buttons, and recruiter-side view if confirmed in scope.
- Unit tests for the action mapping, access control, rate limits, email-to-interaction matching and the native Take note actions.

Phase: Backlog, needs design discussion before scheduling  
Dependencies: US-I16, US-I13 to US-I15 (native actions), US-I10 (opportunity contract), notification infrastructure

### Epic: Naming and Navigation

#### US-I18: Candidate-Facing Names for Interactions, Aligned With Jobs
As a candidate  
I want the recruiter conversations I am tracking to have a clear, customer-friendly name that does not clash with the Jobs section  
So that I understand at a glance what is in each section, without seeing internal terms such as "Interactions" and "Events"

Current state (verified in code):
- `/jobs` (applicants only) holds `Opportunities` (`/jobs/opportunities`, the feed of job ads posted on the platform) and `My Applications` (`/jobs/applications`).
- `/interactions` (applicants and recruiters) holds `Analytics`, `Events`, `Reconnect` and `Email Sync`, from `shared/navigation/interactions-nav.ts`. (Superseded: `Email Sync` has since been removed from the nav and is reached through the "Discover Leads" button on the Leads page.) The nav drawer section and the home card are both called "Interactions". The admin drawer lists "Interaction Events" under Platform Operations.
- The home totals are "Active Interactions" and "New Opportunities". "New Opportunities" counts email threads still at Contacted, so the same word means a posted job on `/jobs/opportunities` and a recruiter email thread on the home page.
- "Events" is the name of the page that lists the conversations, but each item in it is a conversation (a thread), and "events" are the individual messages inside it.

Problem:
- "Interactions" and "Events" are internal terms and say nothing about the value to a candidate.
- "Opportunities" cannot simply be used for the Interactions section while it is also the name of the job feed under Jobs.
- US-I16 and US-I17 will bring platform applications and messages into the same view, so the name must still fit when a conversation did not start with a recruiter email.

Acceptance Criteria:
- Candidate-facing navigation (nav drawer, home sidebar list and home card), page headings and the home totals use the agreed name instead of "Interactions", "Events", "Active Interactions" and the clashing "New Opportunities".
- No candidate-facing label uses the same word as another section for a different thing (the word chosen for the Jobs feed is not reused for conversations).
- The relationship between the two areas is clear from the wording: Jobs is what is posted on the platform and what the candidate applied to; the conversations area is every recruiter contact the candidate is tracking, whichever channel it came from.
- Admin keeps the technical terms ("Interaction Events" under Platform Operations) and the admin guard behaviour is unchanged.
- Routes stay `/interactions/*` in this story so existing links, guards and the feature flag are untouched. A rename of the route path is a separate decision (it would need redirects).
- Order and grouping of the nav drawer are reviewed so the two sections read as a pair (for example the conversations section next to Jobs).
- No behaviour change: only labels, headings, helper text and empty-state copy.

Design decisions (proposed, to be confirmed):
- D1, the name. Options, with a recommendation:
  - Option A (recommended): "Recruiter Leads" for the section, "Leads" for the page that was "Events", home totals "Active Leads" and "New Leads". It keeps `Jobs > Opportunities` as is, so no clash and no change to the job feed. Weakness: a platform-originated item from US-I16 is not strictly a recruiter lead, and recruiters also see this section.
  - Option B: use "Opportunities" for the conversations and rename the job feed (for example "Browse Jobs"). It matches the vocabulary already in the code (`OpportunityContext`, "Role at Company" header, "New Opportunities") and the MO brand (More Opportunities), but it renames an established page, its route and sibling UX pattern, and touches the Jobs documentation.
  - Option C: fold the conversations into Jobs as a third tab. Rejected for now because Jobs is applicant-only and Interactions is also used by recruiters.
- D2, recruiter view. The Interactions section is shared by applicants and recruiters. "Recruiter Leads" is wrong for a recruiter, so either the label is role-aware (candidate sees the lead name, recruiter keeps a neutral name such as "Conversations"), or one neutral name is used for both. Proposed: role-aware label from one shared constant so the drawer, the home sidebar and the page heading cannot drift.
- D3, "Events". Proposed: the page that lists conversations is renamed with the section name; "event" stays only for the individual messages inside a conversation and for the admin technical view.
- Keep all labels in one place (the `interactions-nav.ts` constants and a small label helper) instead of repeating strings in components, so a later rename is one change. Route paths and the `interactionsEventsEnabled` flag are not renamed.
- US-I16 and US-I17: the chosen name must read correctly for a conversation that started on the platform. Applications in `My Applications` stay the source of truth for application status; the conversations area links to them (see US-I16) rather than replacing that page.

Open questions (not yet decided):
- Which option (A, B or C) and the final wording. This blocks implementation. Per the UX instructions the trade-off is surfaced here rather than applied silently.
- Is the recruiter label separate from the candidate label (D2)?
- Do the Interactions Phase 2 docs, the ML docs and the `more-about.md` brand copy need the same wording?

Frontend changes required:
- Replace the user-facing strings in `interactions-nav.ts`, the nav drawer sections, the home card and totals (`home.component`), the page headings and empty-state copy in the interactions pages, using the shared label constants.
- Update the specs that assert the old labels (for example the home sidebar list that expects `Analytics, Events, Reconnect, Email Sync`) and add specs for the role-aware label and for the admin technical label being unchanged.
- Update this document, `PRODUCTION_READINESS.md` (already moved here) and the user-facing wording in the other Interactions docs once the name is chosen.

Backend changes required:
- None. DTO, API and route names are unchanged.

Phase: Current workstream, ready once D1 and D2 are confirmed  
Dependencies: none to start; must stay compatible with US-I16 and US-I17

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
| US-I12 | Job spec intelligence parent story, split into US-I12a to US-I12d (shared design, ownership, precedence and idempotency in the story) | Unscheduled | US-I3, US-I10, US-I11, Living CV; recruiter-side uploads need US-I16/US-I17 and US 1.4a; engagement link is a later enhancement | TBD | Backlog |
| US-I12a | Job spec analysis foundation and manual upload (safe parse, redaction, extraction, grounding, status polling, scope/origin, idempotency) | Unscheduled | US-I10 | TBD | Backlog |
| US-I12b | Profile fit and candidate correction of the extracted spec (per-candidate override table) | Unscheduled | US-I12a, US-I3, Living CV | TBD | Backlog |
| US-I12c | Gmail job spec attachments read automatically | Unscheduled | US-I12a, Gmail adapter change | TBD | Backlog |
| US-I12d | Living CV weaknesses and focus areas | Unscheduled | US-I10, Living CV (US-I12a and US-I12b optional inputs) | TBD | Backlog |
| US-I13 | Take Note reply actions (send CV, follow-up, suggest times, feedback) | Unscheduled | Take note panel, US-I10, Gmail scope decision | TBD | Backlog |
| US-I14 | Take Note calendar actions (add interview, plan assessment) | Unscheduled | Take note panel, US-I10, US-I13 | TBD | Backlog |
| US-I15 | Take Note preparation actions (screening answers, availability, offer targets) | Unscheduled | Take note panel, US-I12, US-I13 | TBD | Backlog |
| US-I16 | Platform-originated interaction from job interest or application (includes engagement link design note and three-tier matching rule) | Unscheduled | Job ads, interest and applications, US-I10, US-I6 | TBD | Backlog (blocker questions open) |
| US-I17 | Conversation on the platform and handoff to email (uses the US-I16 matching rule and engagement link) | Unscheduled | US-I16, US-I13 to US-I15, notification infrastructure | TBD | Backlog (blocker questions open) |
| US-I18 | Candidate-facing names for Interactions and Events, aligned with Jobs | Current | None (compatible with US-I16, US-I17) | 0.5 sprint | Ready, naming decision (D1, D2) pending |

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
- US-I12 is a backlog parent story, split into US-I12a (analysis foundation and manual upload), US-I12b (profile fit and candidate correction), US-I12c (Gmail attachments) and US-I12d (Living CV weaknesses and focus areas). Today the Gmail adapter reads only text parts, so attachments are ignored and `JOB_SPEC_ATTACHED` is inferred from the email text. Design decisions made during refinement: neither the document nor its text is stored (only derived data, a short redacted evidence snippet per item and a text hash); analysis runs through a Postgres-backed table and queue behind an interface rather than a message broker; LangChain4j with the local Ollama model is used for the new extraction only, behind our own interface; items are grounded deterministically against the source text instead of using model confidence scores; the extraction call also rejects documents that are not job specs; fit narrative is templated in v1. Deferred scope is tracked in section 11 of `INTERACTIONS_INTELLIGENCE_PHASE_2_PRODUCTION_SCALE.md`. Open items: profile data source, fit verdict policy, how repeated gaps are counted, whether focus areas feed Market Readiness, and Information Officer confirmation before US-I12c ships.
- US-I13 to US-I15 define the behaviour behind the Take note action buttons. The buttons and their stable ids (`CandidateNoteActionId` in `utils/candidate-notes.util.ts`) already exist in the UI, but clicking them does nothing yet. US-I13 first needs a decision on Gmail scope (the current `gmail.readonly` scope cannot create drafts or send mail).
- US-I16 and US-I17 cover interactions that start on the platform (a candidate shows interest in or applies to a posted job) and the conversation that follows, including the move to email. `ChannelType.MO_NATIVE` already exists in the frontend model, and `RecruiterInteraction` already allows a nullable recruiter, so the model is largely in place. **Blocker questions are open on both stories and must be answered before implementation** (interest versus application, merging with an existing email thread, recruiter-side scope, candidate alias handling, structured actions versus free text, and email-to-interaction matching). Until then the stories are documentation only.
- US-I18 replaces the former production-readiness item about candidate-facing navigation labels. It is label-only (routes, guards and the feature flag are unchanged) and is blocked only on the naming decision. The name "Opportunities" is already used by `/jobs/opportunities`, so using it for conversations would also mean renaming the job feed.
- US-I8 remains optional and should be enabled only if admin testing volume justifies compact density mode.
- Keep role-scoped gating and centralized feature-flag conventions unchanged while implementing these stories.
