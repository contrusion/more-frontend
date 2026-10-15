import { UrlTree, Router } from '@angular/router';
import { InteractionsAccessGuard } from './interactions-access.guard';
import { AuthService } from '../services/auth.service';
import { FeatureFlagsService } from '../../../shared/services/feature-flags.service';

describe('InteractionsAccessGuard', () => {
  let guard: InteractionsAccessGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let featureFlagsService: jasmine.SpyObj<FeatureFlagsService>;
  let blockedRedirect: UrlTree;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    featureFlagsService = jasmine.createSpyObj<FeatureFlagsService>('FeatureFlagsService', ['isInteractionsEventsEnabled']);

    blockedRedirect = { toString: () => '/home' } as unknown as UrlTree;
    router.parseUrl.and.returnValue(blockedRedirect);

    guard = new InteractionsAccessGuard(authService, router, featureFlagsService);
  });

  it('blocks MO_ADMIN when interactions feature is disabled', () => {
    featureFlagsService.isInteractionsEventsEnabled.and.returnValue(false);
    authService.hasRole.and.returnValue(true);

    const result = guard.canActivate();

    expect(featureFlagsService.isInteractionsEventsEnabled).toHaveBeenCalled();
    expect(authService.hasRole).toHaveBeenCalledWith('MO_ADMIN');
    expect(router.parseUrl).toHaveBeenCalledWith('/home');
    expect(result).toBe(blockedRedirect);
  });

  it('allows non-admin users when interactions feature is disabled', () => {
    featureFlagsService.isInteractionsEventsEnabled.and.returnValue(false);
    authService.hasRole.and.returnValue(false);

    const result = guard.canActivate();

    expect(featureFlagsService.isInteractionsEventsEnabled).toHaveBeenCalled();
    expect(authService.hasRole).toHaveBeenCalledWith('MO_ADMIN');
    expect(router.parseUrl).not.toHaveBeenCalled();
    expect(result).toBeTrue();
  });

  it('allows MO_ADMIN when interactions feature is enabled', () => {
    featureFlagsService.isInteractionsEventsEnabled.and.returnValue(true);
    authService.hasRole.and.returnValue(true);

    const result = guard.canActivate();

    expect(featureFlagsService.isInteractionsEventsEnabled).toHaveBeenCalled();
    expect(authService.hasRole).toHaveBeenCalledWith('MO_ADMIN');
    expect(router.parseUrl).not.toHaveBeenCalled();
    expect(result).toBeTrue();
  });
});
