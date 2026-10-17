import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InteractionThreadHeaderComponent } from './interaction-thread-header.component';

describe('InteractionThreadHeaderComponent', () => {
  let fixture: ComponentFixture<InteractionThreadHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionThreadHeaderComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InteractionThreadHeaderComponent);
    fixture.componentRef.setInput('initials', 'SJ');
    fixture.componentRef.setInput('recruiterName', 'Steven Jones');
    fixture.componentRef.setInput('recruiterCompany', 'Best Recruiting');
    fixture.componentRef.setInput('opportunity', 'Recruiting for a Software Engineer');
    fixture.componentRef.setInput('statusSummary', 'You followed up for an update');
    fixture.componentRef.setInput('dealBreakerCount', 0);
    fixture.componentRef.setInput('updatedLabel', '2d ago');
    fixture.componentRef.setInput('stageLabel', 'Contacted');
    fixture.componentRef.setInput('stageClass', 'activity-neutral');
  });

  it('renders recruiter, opportunity and the provided status summary', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Steven Jones');
    expect(text).toContain('Recruiter at Best Recruiting');
    expect(text).toContain('Recruiting for a Software Engineer');
    expect(text).toContain('You followed up for an update');
  });

  it('marks deal breakers as clear when the count is zero', () => {
    fixture.detectChanges();
    const risk = (fixture.nativeElement as HTMLElement).querySelector('.thread-panel-risk');

    expect(risk?.classList).toContain('thread-panel-risk--clear');
  });

  it('flags a stale update chip as not clear', () => {
    fixture.componentRef.setInput('updateStale', true);
    fixture.detectChanges();
    const update = (fixture.nativeElement as HTMLElement).querySelector('.thread-panel-update');

    expect(update?.classList).not.toContain('thread-panel-risk--clear');
  });
});
