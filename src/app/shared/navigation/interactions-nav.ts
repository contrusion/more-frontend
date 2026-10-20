export interface NavLink {
  label: string;
  route: string;
}

/**
 * Final product structure:
 * - Candidate view: "Recruiter Leads" -> "Leads" + "My Recruiters"
 * - Recruiter view: "Candidate Leads" -> "Leads" + "My Candidates"
 * - "Reconnect" remains a sibling workflow at /interactions/reconnection, not a child of the lead queue.
 *
 * We keep the underlying routes stable even when the visible labels change to match the product wording.
 * Example: the app still navigates to /interactions/events, while the page label is "Leads" and the
 * section label is role-specific ("Recruiter Leads" / "Candidate Leads"). This distinction is intentional
 * and helps avoid route-vs-label confusion during debugging.
 *
 * The mailbox page lives at /interactions/email-sync but is intentionally NOT a nav entry. Its visible name is
 * "Discover Leads" and it is reached from the "Discover Leads" button in the Leads page header. The route
 * name is kept because the Gmail OAuth return and existing deep links depend on it.
 */
export const BASE_INTERACTIONS_NAV_LINKS: readonly NavLink[] = [
  { label: 'Analytics', route: '/interactions/analytics' },
  { label: 'Leads', route: '/interactions/events' }
];

export function getInteractionsNavLinksForRole(role: string | null | undefined): readonly NavLink[] {
  const isApplicant = role === 'APPLICANT';

  return [
    ...BASE_INTERACTIONS_NAV_LINKS,
    {
      label: isApplicant ? 'My Recruiters' : 'My Candidates',
      route: isApplicant ? '/interactions/my-recruiters' : '/interactions/my-candidates'
    },
    { label: 'Reconnect', route: '/interactions/reconnection' }
  ];
}

export const INTERACTIONS_NAV_LINKS: readonly NavLink[] = getInteractionsNavLinksForRole('APPLICANT');
