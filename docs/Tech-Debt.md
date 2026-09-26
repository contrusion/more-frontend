# Tech Debt Register

## TD-UI-001: Table Pagination and Responsive Consistency

### Context
Several enterprise list pages were not fully consistent in responsive behavior and pagination strategy.

Affected surfaces:
- /admin/users
- /recruiter/candidates
- /recruiter/job-ads

### Problem
- Dense tables became hard to use on smaller screens.
- Pagination behavior was not consistent across pages.
- Table presentation patterns diverged between admin and recruiter flows.

### Interim Direction Applied
- Aligned header and compact typography treatment across admin and recruiter table pages.
- Removed table-level horizontal scroll presentation.
- Applied fixed-height table viewport approach.
- Introduced or standardized pagination behavior on key list pages.
- Removed Premium indicator from admin table rows (retain detail visibility in user profile view).

### Debt Still Outstanding
1. Standardize on one pagination model for all enterprise tables:
- Preferred long-term model: server-side pagination
- Temporary model used in some flows: client-side pagination

2. Define a shared table responsiveness policy:
- Which columns hide at each breakpoint
- Shared fixed-height tokens by viewport tier
- Shared sticky-header behavior and z-index rules

3. Consolidate repeated table CSS into shared reusable patterns without breaking feature ownership.

4. Add regression coverage for:
- Pagination reset on filter and search changes
- Cross-browser typography consistency (Chrome and Edge)
- Mobile breakpoints for table readability

### Proposed Target State
- Server-side pagination on all high-volume list pages.
- Unified response shape and query contract: page, size, sort, filters.
- Shared UX contract for compact enterprise tables across admin and recruiter modules.

### Suggested Next Work Items
1. Convert recruiter job ads pagination flow to server-driven contract.
2. Extract shared table tokens and breakpoint rules.
3. Add component-level tests for paging, filtering, and responsive state handling.
4. Add a short QA checklist for Chrome and Edge validation on table pages.

### Traceability
Related user story:
- US-ADM-Table-Pagination: Improve admin users table usability on smaller screens.

## TD-UI-002: Reusable Enterprise Table and Header Componentization

### Context
Table and header patterns are repeated across multiple pages with mostly the same structure and behavior.

Affected surfaces:
- /admin/users
- /recruiter/candidates
- /recruiter/job-ads

### Problem
- Repeated markup and CSS increase maintenance cost.
- Pagination, responsive breakpoints, and status rendering can drift between pages.
- Header behavior and typography can become inconsistent over time.

### Required User Stories
1. US-UI-C1: Reusable Enterprise Data Table Component
- Build a plug-and-play standalone table component driven by typed column config.
- Must support server-side and client-side pagination modes.
- Must support sticky headers, fixed viewport height, loading/empty/error states.
- Must support row actions, row click events, and responsive column priority rules.

2. US-UI-C2: Reusable Sticky Enterprise Page Header Component
- Build a reusable header component for title, subtitle, count/status chip, and action area.
- Must support projected filter/content slot.
- Must support compact and standard variants with shared fluid typography tokens.

3. US-UI-C3: Reusable Pagination Component
- Build shared pagination controls with page, prev/next, disabled edge states, and accessibility labels.

### Additional Reusable Components to Add
- Filter pill group component
- Table state block component (loading/error/empty)
- Status dot component
- Action toolbar component
- Column visibility manager directive (breakpoint-driven)

### Proposed Delivery Order
1. Reusable pagination component
2. Table state block component
3. Status dot component
4. Sticky page header component
5. Enterprise table component
6. Filter pill group and column visibility directive

### Acceptance Baseline for Componentization
- No page-specific hardcoded table behavior for pagination or responsive hiding.
- Shared components consumed by admin users, recruiter candidates, and recruiter job-ads pages.
- Cross-browser validation performed in Chrome and Edge.
- Existing UX governance preserved from .github/instructions/ux.instructions.md.
