import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type FeatureFlags = typeof environment.features;
export type FeatureFlagKey = keyof FeatureFlags;

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {
  isEnabled(flag: FeatureFlagKey): boolean {
    return Boolean(environment.features?.[flag]);
  }

  isInteractionsEventsEnabled(): boolean {
    return this.isEnabled('interactionsEventsEnabled');
  }
}