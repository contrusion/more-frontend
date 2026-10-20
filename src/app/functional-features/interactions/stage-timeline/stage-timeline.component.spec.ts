import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityTimelineStep, StageTimelineComponent } from './stage-timeline.component';

describe('StageTimelineComponent', () => {
  let fixture: ComponentFixture<StageTimelineComponent>;
  const host = () => fixture.nativeElement as HTMLElement;

  const steps: ActivityTimelineStep[] = [
    { label: 'Outreach', tone: 'neutral', reachedAt: new Date(2026, 9, 1), count: 1, state: 'past', current: false },
    { label: 'Screening', tone: 'info', reachedAt: new Date(2026, 9, 4), count: 2, state: 'past', current: false },
    { label: 'Interviews & Assessments', tone: 'success', reachedAt: new Date(2026, 9, 9), count: 1, state: 'current', current: true },
    { label: 'Offer stage', tone: 'info', count: 0, state: 'upcoming', current: false },
    { label: 'Closed', tone: 'danger', count: 0, state: 'upcoming', current: false }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StageTimelineComponent] }).compileComponents();
    fixture = TestBed.createComponent(StageTimelineComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.detectChanges();
  });

  it('renders one item per group in order', () => {
    const labels = Array.from(host().querySelectorAll('.stage-label')).map(el => el.textContent?.trim());

    expect(labels).toEqual(['Outreach', 'Screening', 'Interviews & Assessments', 'Offer stage', 'Closed']);
  });

  it('applies the semantic tone of each group', () => {
    const items = host().querySelectorAll('.stage-item');

    expect(items[0].classList).toContain('tone-neutral');
    expect(items[1].classList).toContain('tone-info');
    expect(items[2].classList).toContain('tone-success');
  });

  it('flags the current step and leaves later groups available as upcoming', () => {
    const items = host().querySelectorAll('.stage-item');

    expect(items[2].classList).toContain('current');
    expect(items[2].getAttribute('aria-current')).toBe('step');
    expect(items[3].classList).toContain('state-upcoming');
    expect(items[0].classList).not.toContain('current');
    expect(items[0].getAttribute('aria-current')).toBeNull();
  });

  it('shows a visible current badge on the latest step', () => {
    const currentBadge = host().querySelector('.stage-item.current .stage-current');

    expect(currentBadge?.textContent?.trim()).toBe('Current');
  });

  it('shows ticks for completed steps', () => {
    const completed = host().querySelectorAll('.stage-item.state-past .stage-complete');

    expect(Array.from(completed).map(el => el.textContent?.trim())).toEqual(['✓', '✓']);
  });

  it('keeps the timeline inside a horizontally scrollable container', () => {
    expect(host().querySelector('.stage-timeline-scroll')).not.toBeNull();
  });

  it('shows when each reached group began and how many events stayed in it', () => {
    const dates = Array.from(host().querySelectorAll('.stage-date')).map(el => el.textContent?.replace(/\s+/g, ' ').trim());

    expect(dates).toEqual(['1 Oct', '4 Oct ×2', '9 Oct']);
  });

  const datesFor = (input: ActivityTimelineStep[]) => {
    fixture.componentRef.setInput('steps', input);
    fixture.detectChanges();
    return Array.from(host().querySelectorAll('.stage-date')).map(el => el.textContent?.replace(/\s+/g, ' ').trim());
  };

  it('shows the window between the neighbouring stages for a passed step with no recorded events', () => {
    const dates = datesFor([
      { label: 'Outreach', tone: 'neutral', reachedAt: new Date(2026, 9, 3), count: 1, state: 'past', current: false },
      { label: 'Screening', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Interviews & Assessments', tone: 'success', reachedAt: new Date(2026, 9, 9), count: 1, state: 'current', current: true }
    ]);

    expect(dates).toEqual(['3 Oct', '3 \u2013 9 Oct', '9 Oct']);
    expect(host().querySelector('.stage-date-inferred')?.getAttribute('title')).toContain('window between');
    expect(host().textContent).not.toContain('Not reached');
  });

  it('includes both months when the window crosses a month boundary', () => {
    const dates = datesFor([
      { label: 'Outreach', tone: 'neutral', reachedAt: new Date(2026, 8, 29), count: 1, state: 'past', current: false },
      { label: 'Screening', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Interviews & Assessments', tone: 'success', reachedAt: new Date(2026, 9, 2), count: 1, state: 'current', current: true }
    ]);

    expect(dates[1]).toBe('29 Sep \u2013 2 Oct');
  });

  it('shows a single date when the neighbouring stages fall on the same day', () => {
    const dates = datesFor([
      { label: 'Outreach', tone: 'neutral', reachedAt: new Date(2026, 9, 9), count: 1, state: 'past', current: false },
      { label: 'Screening', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Interviews & Assessments', tone: 'success', reachedAt: new Date(2026, 9, 9), count: 1, state: 'current', current: true }
    ]);

    expect(dates[1]).toBe('9 Oct');
  });

  it('skips undated neighbours when looking for the window', () => {
    const dates = datesFor([
      { label: 'Outreach', tone: 'neutral', reachedAt: new Date(2026, 9, 3), count: 1, state: 'past', current: false },
      { label: 'Screening', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Offer stage', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Closed', tone: 'neutral', reachedAt: new Date(2026, 9, 12), count: 1, state: 'current', current: true }
    ]);

    expect(dates).toEqual(['3 Oct', '3 \u2013 12 Oct', '3 \u2013 12 Oct', '12 Oct']);
  });

  it('falls back to Completed when no dated stage bounds the gap', () => {
    const dates = datesFor([
      { label: 'Outreach', tone: 'neutral', count: 0, state: 'past', current: false },
      { label: 'Screening', tone: 'info', count: 0, state: 'past', current: false },
      { label: 'Interviews & Assessments', tone: 'success', reachedAt: new Date(2026, 9, 9), count: 1, state: 'current', current: true }
    ]);

    expect(dates).toEqual(['Completed', 'Completed', '9 Oct']);
  });

  it('describes each step in visually hidden text', () => {
    const hidden = Array.from(host().querySelectorAll('.stage-sr')).map(el => el.textContent?.trim());

    expect(hidden).toEqual(['completed', 'completed, 2 events', 'current', 'upcoming', 'upcoming']);
  });

  it('sizes the track to the number of steps and exposes a list label', () => {
    const list = host().querySelector('ol') as HTMLOListElement;

    expect(list.getAttribute('aria-label')).toBe('Recent activity');
    expect(list.style.getPropertyValue('--stage-count')).toBe('5');
  });
});
