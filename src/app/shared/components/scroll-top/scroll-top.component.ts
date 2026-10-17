import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrollTop } from 'primeng/scrolltop';

/**
 * Shared "back to top" button built on the PrimeNG ScrollTop, with the app's theme and motion defaults.
 *
 * - `target="parent"` (default): wrap the scrollable content in `<app-scroll-top>`; the component becomes the
 *   scroll container and the button sticks to its bottom corner.
 * - `target="window"`: place it anywhere; it is fixed to the viewport corner.
 */
@Component({
  selector: 'app-scroll-top',
  standalone: true,
  imports: [ScrollTop],
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.scroll-container]': "target() === 'parent'" }
})
export class ScrollTopComponent {
  /** Which element is observed and scrolled. */
  readonly target = input<'window' | 'parent'>('parent');

  /** Vertical scroll position (px) after which the button appears. */
  readonly threshold = input(200);

  /** Accessible name of the button. */
  readonly ariaLabel = input('Scroll to top');

  /** PrimeNG defaults the button to the green "success" severity; the primary severity is themed in the CSS. */
  protected readonly buttonProps = { rounded: true };

  /** Smooth scrolling is replaced by an instant jump for users who prefer reduced motion. */
  protected readonly behavior: 'auto' | 'smooth' =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
