# UX-UI Patterns

## Governance
- This document is the human-facing UX playbook (examples, naming, and quick commands).
- Enforcement source for Copilot is `.github/instructions/ux.instructions.md`.
- If there is a conflict, follow `.github/instructions/ux.instructions.md` and then update this document to match.

## 1) Sticky Enterprise Filter Header
Use when: list pages with filters where users scroll a lot.

Includes:
- Sticky utility header
- Persistent filter bar
- Enterprise compact typography
- Centered pill filters

Ask phrase:
- Apply the sticky enterprise filter-header pattern.

## 2) Compact Data Workspace
Use when: dashboard or table-heavy screens where density matters.

Includes:
- Tight vertical rhythm
- Reduced card chrome
- Small but readable labels
- Right-aligned utility actions

Ask phrase:
- Apply the compact data workspace pattern.

## 3) Progressive Disclosure Panels
Use when: forms or filters have advanced options that should not overwhelm users.

Includes:
- Basic options always visible
- Advanced options behind expandable section
- Clear defaults and reset action

Ask phrase:
- Apply progressive disclosure for advanced controls.

## 4) Split Action Toolbar
Use when: pages need primary action plus several secondary actions.

Includes:
- Left side context (title/count)
- Right side actions
- Single emphasized primary button
- Secondary actions as ghost/outlined buttons

Ask phrase:
- Use a split action toolbar with one primary CTA.

## 5) Status-Driven Card System
Use when: cards represent lifecycle states (submitted, reviewed, closed, etc.).

Includes:
- Consistent status badge tokens
- State-based border or accent color
- Readable timestamp + key metadata

Ask phrase:
- Apply status-driven cards with unified badge tokens.

## 6) Empty State with Guided Next Step
Use when: zero-data states need to direct users clearly.

Includes:
- Clear statement of empty state
- One actionable next step
- Optional contextual link

Ask phrase:
- Add guided empty-state pattern with a clear next action.

## 7) Inline Feedback and Recovery
Use when: network failures, validation issues, or retry scenarios exist.

Includes:
- Non-blocking inline error banner
- Retry affordance near failed section
- Success and loading states aligned visually

Ask phrase:
- Apply inline feedback and recovery pattern.

## 8) Mobile-First Action Stacking
Use when: desktop horizontal controls break on smaller screens.

Includes:
- Desktop horizontal layout
- Mobile vertical stacking for actions and filters
- Consistent touch targets

Ask phrase:
- Apply mobile-first action stacking.

## 9) Information Hierarchy Ladder
Use when: cards or rows have many text fields competing for attention.

Includes:
- Strong primary text
- Muted secondary text
- Meta text at smallest readable scale
- Predictable spacing tiers

Ask phrase:
- Apply hierarchy ladder typography and spacing.

## 10) Consistent Interaction Language
Use when: similar controls across pages should behave and look the same.

Includes:
- Shared button sizes and corner radius
- Shared hover/focus/disabled behaviors
- Shared status colors and shadows

Ask phrase:
- Standardize this page to our interaction language pattern.

---

## Recommended Quick Commands
- Use sticky enterprise filter-header.
- Make this a compact data workspace.
- Add progressive disclosure for advanced options.
- Apply status-driven cards.
- Add guided empty-state with next step.