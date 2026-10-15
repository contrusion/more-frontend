import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FeatureFlagsService } from '../../../shared/services/feature-flags.service';

@Injectable({
  providedIn: 'root'
})
export class InteractionsAccessGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
    private featureFlagsService: FeatureFlagsService
  ) {}

  canActivate(): boolean | UrlTree {
    const interactionsEventsEnabled = this.featureFlagsService.isInteractionsEventsEnabled();
    const isAdmin = this.authService.hasRole('MO_ADMIN');

    if (!interactionsEventsEnabled && isAdmin) {
      return this.router.parseUrl('/home');
    }

    return true;
  }
}