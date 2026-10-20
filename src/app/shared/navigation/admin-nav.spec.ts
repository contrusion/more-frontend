import { ADMIN_PLATFORM_OPERATIONS_LINKS, getAdminRailLinks, ML_UNKNOWN_REVIEW_ROUTE } from './admin-nav';

describe('admin-nav', () => {
  it('lists the ML pages in the Platform Operations branch', () => {
    const routes = ADMIN_PLATFORM_OPERATIONS_LINKS.map(link => link.route);

    expect(routes).toContain('/admin/ml-prompt');
    expect(routes).toContain(ML_UNKNOWN_REVIEW_ROUTE);
    expect(ML_UNKNOWN_REVIEW_ROUTE).toBe('/admin/ml-unknown-review');
  });

  it('shows only the Platform Operations pages in the rail for an ML page', () => {
    const routes = getAdminRailLinks('/admin/ml-prompt').map(link => link.route);

    expect(routes).toEqual([
      '/admin/companies',
      '/admin/challenges',
      '/admin/outreach-ml',
      '/admin/ml-prompt',
      ML_UNKNOWN_REVIEW_ROUTE,
      '/interactions/events'
    ]);
  });

  it('hides Interaction Events from the rail while the events flag is off', () => {
    const routes = getAdminRailLinks('/admin/ml-prompt', false).map(link => link.route);

    expect(routes).not.toContain('/interactions/events');
    expect(routes).toContain(ML_UNKNOWN_REVIEW_ROUTE);
  });

  it('keeps the rail for pages nested under a branch page', () => {
    expect(getAdminRailLinks('/admin/challenges/new').length).toBeGreaterThan(0);
    expect(getAdminRailLinks('/admin/challenges/42/edit').length).toBeGreaterThan(0);
  });

  it('has no rail on single-page branches', () => {
    expect(getAdminRailLinks('/admin/dashboard')).toEqual([]);
    expect(getAdminRailLinks('/admin/users')).toEqual([]);
    expect(getAdminRailLinks('/admin/users/123')).toEqual([]);
  });

  it('has no rail outside the admin area', () => {
    expect(getAdminRailLinks('/home')).toEqual([]);
  });
});
