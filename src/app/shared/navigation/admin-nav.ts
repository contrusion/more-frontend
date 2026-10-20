export type AdminNavIcon = 'companies' | 'challenges' | 'ml-data' | 'ml-prompt' | 'ml-review' | 'events';

export interface AdminNavLink {
  /** Label shown in the navigation drawer. */
  label: string;
  /** Short label shown under the icon in the side rail. */
  railLabel: string;
  route: string;
  icon: AdminNavIcon;
}

export const ML_UNKNOWN_REVIEW_ROUTE = '/admin/ml-unknown-review';

/**
 * The "Platform Operations" branch of the admin drawer.
 *
 * The drawer and the admin side rail both read this list, so they always agree on what belongs to the branch.
 * "Overview" and "User Management" are single-page branches and therefore have no side rail.
 * "Interaction Events" opens the interactions layout but stays part of this branch; it is hidden while the events flag is off.
 */
export const ADMIN_PLATFORM_OPERATIONS_LINKS: readonly AdminNavLink[] = [
  { label: 'Companies', railLabel: 'Companies', route: '/admin/companies', icon: 'companies' },
  { label: 'Challenges', railLabel: 'Challenges', route: '/admin/challenges', icon: 'challenges' },
  { label: 'Outreach ML Export', railLabel: 'ML Data', route: '/admin/outreach-ml', icon: 'ml-data' },
  { label: 'ML Prompt', railLabel: 'Prompt', route: '/admin/ml-prompt', icon: 'ml-prompt' },
  { label: 'ML Review', railLabel: 'Review', route: ML_UNKNOWN_REVIEW_ROUTE, icon: 'ml-review' },
  { label: 'Interaction Events', railLabel: 'Events', route: '/interactions/events', icon: 'events' }
];

/** Side-rail items for the admin branch the url belongs to; empty when the page has no rail. */
export function getAdminRailLinks(url: string, interactionsEventsEnabled = true): readonly AdminNavLink[] {
  const inBranch = ADMIN_PLATFORM_OPERATIONS_LINKS.some(link => url.startsWith(link.route));
  if (!inBranch) {
    return [];
  }
  return ADMIN_PLATFORM_OPERATIONS_LINKS.filter(link => link.icon !== 'events' || interactionsEventsEnabled);
}
