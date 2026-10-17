import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollTop } from 'primeng/scrolltop';
import { ScrollTopComponent } from './scroll-top.component';

describe('ScrollTopComponent', () => {
  let fixture: ComponentFixture<ScrollTopComponent>;

  const primeScrollTop = (): ScrollTop => fixture.debugElement.query(By.directive(ScrollTop)).componentInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ScrollTopComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(ScrollTopComponent);
    fixture.detectChanges();
  });

  it('wraps the PrimeNG scroll top with the shared defaults', () => {
    const scrollTop = primeScrollTop();

    expect(scrollTop.target).toBe('parent');
    expect(scrollTop.threshold).toBe(200);
    expect(scrollTop.buttonAriaLabel).toBe('Scroll to top');
    expect(scrollTop.styleClass).toBe('app-scroll-top');
  });

  it('forwards the target, threshold and accessible label', () => {
    fixture.componentRef.setInput('target', 'window');
    fixture.componentRef.setInput('threshold', 80);
    fixture.componentRef.setInput('ariaLabel', 'Back to top of the list');
    fixture.detectChanges();

    const scrollTop = primeScrollTop();

    expect(scrollTop.target).toBe('window');
    expect(scrollTop.threshold).toBe(80);
    expect(scrollTop.buttonAriaLabel).toBe('Back to top of the list');
  });

  it('uses smooth scrolling unless the user prefers reduced motion', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    expect(primeScrollTop().behavior).toBe(prefersReducedMotion ? 'auto' : 'smooth');
  });

  it('does not use the green success severity PrimeNG applies by default', () => {
    expect(primeScrollTop().buttonProps).toEqual({ rounded: true });
  });

  it('is the scroll container of its content when the target is the parent', () => {
    expect(fixture.nativeElement.classList).toContain('scroll-container');
    expect(primeScrollTop().el.nativeElement.parentElement).toBe(fixture.nativeElement);

    fixture.componentRef.setInput('target', 'window');
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).not.toContain('scroll-container');
  });
});
