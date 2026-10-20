import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MlUnknownClassificationsComponent } from './ml-unknown-classifications.component';
import { MlPromptService } from './ml-prompt.service';
import { MlUnknownClassification, MlUnknownPage } from './ml-prompt.model';

describe('MlUnknownClassificationsComponent', () => {
  let fixture: ComponentFixture<MlUnknownClassificationsComponent>;
  let component: MlUnknownClassificationsComponent;
  let service: jasmine.SpyObj<MlPromptService>;

  const item = (overrides: Partial<MlUnknownClassification> = {}): MlUnknownClassification => ({
    id: 'u1', messageId: 'm1', interactionEventId: 'e1', sourceProvider: 'GMAIL', subject: 'Hello', messageText: 'Body text',
    rawEventType: 'MYSTERY', rawAdditionalEventTypes: ['OTHER'], unknownLabels: ['MYSTERY'],
    modelReason: 'Because', unknownCause: 'Label not in published list', confidence: 0.55, promptVersion: 3,
    status: 'NEW', createdAt: '2026-01-01T10:00:00', expiresAt: '2026-04-01T10:00:00', daysRemaining: 30,
    reviewedBy: null, reviewedAt: null, ...overrides
  });

  const page = (content: MlUnknownClassification[], totalPages = 1): MlUnknownPage => ({
    content, totalElements: content.length, totalPages, number: 0, size: 20
  });

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', ['getUnknownClassifications', 'updateUnknownStatus', 'getUnknownSummary']);
    service.getUnknownClassifications.and.returnValue(of(page([item()])));
    service.getUnknownSummary.and.returnValue(of({ unreviewedCount: 0 }));

    await TestBed.configureTestingModule({ imports: [MlUnknownClassificationsComponent] })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    fixture = TestBed.createComponent(MlUnknownClassificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads new items by default', () => {
    expect(service.getUnknownClassifications).toHaveBeenCalledWith('NEW', 0, 20);
    expect(component.items().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('MYSTERY');
    expect(fixture.nativeElement.textContent).toContain('Deleted in 30 days');
  });

  it('shows an empty state when nothing matches', () => {
    service.getUnknownClassifications.and.returnValue(of(page([])));

    component.load();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nothing to review');
  });

  it('shows an error when loading fails', () => {
    service.getUnknownClassifications.and.returnValue(throwError(() => ({})));

    component.load();

    expect(component.errors().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('applies a filter from the first page, using no status for "All"', () => {
    component.page.set(2);

    component.applyFilter('ALL');

    expect(component.page()).toBe(0);
    expect(service.getUnknownClassifications).toHaveBeenCalledWith(null, 0, 20);

    component.applyFilter('REVIEWED');
    expect(service.getUnknownClassifications).toHaveBeenCalledWith('REVIEWED', 0, 20);
  });

  it('pages forwards and backwards within bounds', () => {
    service.getUnknownClassifications.and.returnValue(of(page([item()], 2)));
    component.load();
    service.getUnknownClassifications.calls.reset();

    component.previousPage();
    expect(service.getUnknownClassifications).not.toHaveBeenCalled();

    component.nextPage();
    expect(component.page()).toBe(1);
    expect(service.getUnknownClassifications).toHaveBeenCalledWith('NEW', 1, 20);

    service.getUnknownClassifications.calls.reset();
    component.nextPage();
    expect(service.getUnknownClassifications).not.toHaveBeenCalled();

    component.previousPage();
    expect(component.page()).toBe(0);
  });

  it('expands and collapses a message', () => {
    component.toggle('u1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Body text');
    expect(fixture.nativeElement.textContent).toContain('Because');

    component.toggle('u1');
    expect(component.expandedId()).toBeNull();
  });

  it('removes an item from a filtered list once its status changes', () => {
    service.updateUnknownStatus.and.returnValue(of(item({ status: 'REVIEWED' })));

    component.setStatus(component.items()[0], 'REVIEWED');

    expect(service.updateUnknownStatus).toHaveBeenCalledWith('u1', 'REVIEWED');
    expect(component.items()).toEqual([]);
    expect(component.totalElements()).toBe(0);
  });

  it('refreshes the unreviewed count after a status change', () => {
    service.updateUnknownStatus.and.returnValue(of(item({ status: 'REVIEWED' })));

    component.setStatus(component.items()[0], 'REVIEWED');

    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('updates an item in place when showing all statuses', () => {
    service.getUnknownClassifications.and.returnValue(of(page([item()])));
    component.applyFilter('ALL');
    service.updateUnknownStatus.and.returnValue(of(item({ status: 'DISMISSED' })));

    component.setStatus(component.items()[0], 'DISMISSED');

    expect(component.items()[0].status).toBe('DISMISSED');
  });

  it('shows an error when a status update fails', () => {
    service.updateUnknownStatus.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

    component.setStatus(component.items()[0], 'REVIEWED');

    expect(component.errors()).toEqual(['Not found']);
    expect(component.updatingId()).toBeNull();
  });

  it('maps statuses to tag severities', () => {
    expect(component.statusSeverity('NEW')).toBe('warn');
    expect(component.statusSeverity('REVIEWED')).toBe('success');
    expect(component.statusSeverity('DISMISSED')).toBe('secondary');
  });

  it('words the retention countdown', () => {
    expect(component.retentionLabel(item({ daysRemaining: 0 }))).toBe('Deleted today');
    expect(component.retentionLabel(item({ daysRemaining: 1 }))).toBe('Deleted in 1 day');
    expect(component.retentionLabel(item({ daysRemaining: 12 }))).toBe('Deleted in 12 days');
  });
});
