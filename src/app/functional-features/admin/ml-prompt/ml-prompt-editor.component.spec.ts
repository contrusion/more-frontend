import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MlPromptEditorComponent } from './ml-prompt-editor.component';
import { MlPromptService } from './ml-prompt.service';
import { MlPromptDraft, MlPromptStatus, MlPromptVersion } from './ml-prompt.model';

describe('MlPromptEditorComponent', () => {
  let fixture: ComponentFixture<MlPromptEditorComponent>;
  let component: MlPromptEditorComponent;
  let service: jasmine.SpyObj<MlPromptService>;
  const unreviewedCount = signal(0);

  const draft: MlPromptDraft = { sections: [], groups: [], labels: [] };
  const status = (overrides: Partial<MlPromptStatus> = {}): MlPromptStatus => ({
    publishedVersion: 2, runningVersion: 1, unpublishedChanges: true, restartPending: true, validationErrors: [], ...overrides
  });
  const version: MlPromptVersion = {
    id: 'v2', versionNumber: 2, note: 'n', publishedBy: 'admin', publishedAt: '2026-01-01T10:00:00', running: false, renderedPrompt: null
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', [
      'getDraft', 'getStatus', 'getPreview', 'publish', 'getVersions', 'getVersion', 'restoreToDraft', 'getUnknownSummary'
    ], { unreviewedCount });
    unreviewedCount.set(0);
    service.getUnknownSummary.and.returnValue(of({ unreviewedCount: 0 }));
    service.getDraft.and.returnValue(of(draft));
    service.getStatus.and.returnValue(of(status()));
    service.getPreview.and.returnValue(of({ prompt: 'PROMPT TEXT', validationErrors: [] }));
    service.getVersions.and.returnValue(of([version]));

    await TestBed.configureTestingModule({ imports: [MlPromptEditorComponent], providers: [provideRouter([])] })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    fixture = TestBed.createComponent(MlPromptEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the draft and status on init', () => {
    expect(component.draft()).toEqual(draft);
    expect(component.status()?.runningVersion).toBe(1);
    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Restart pending');
  });

  it('loads the unreviewed count on init', () => {
    expect(service.getUnknownSummary).toHaveBeenCalled();
  });

  it('tells the admin when messages are waiting for review', () => {
    expect(fixture.nativeElement.textContent).not.toContain('waiting for review');

    unreviewedCount.set(3);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('3');
    expect(text).toContain('messages the model could not label');
    expect(text).toContain('are waiting for review');
    expect(fixture.nativeElement.querySelector('a[href="/admin/ml-unknown"]')).not.toBeNull();
  });

  it('uses the singular when one message is waiting', () => {
    unreviewedCount.set(1);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('message the model could not label');
    expect(fixture.nativeElement.textContent).toContain('is waiting for review');
  });

  it('shows an error when loading fails', () => {
    service.getDraft.and.returnValue(throwError(() => ({})));

    component.reload(true);

    expect(component.errors().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('only allows publishing a valid draft with changes', () => {
    expect(component.canPublish()).toBeTrue();

    component.status.set(status({ unpublishedChanges: false }));
    expect(component.canPublish()).toBeFalse();

    component.status.set(status({ validationErrors: ['Rule 1 is missing'] }));
    expect(component.canPublish()).toBeFalse();

    component.status.set(null);
    expect(component.canPublish()).toBeFalse();
  });

  it('shows validation problems that block publishing', () => {
    service.getStatus.and.returnValue(of(status({ validationErrors: ['Rule 1 is missing'] })));

    component.reload();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rule 1 is missing');
  });

  it('loads the preview when its tab opens', () => {
    component.selectTab('preview');
    fixture.detectChanges();

    expect(service.getPreview).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('PROMPT TEXT');
  });

  it('refreshes the preview after a change while the preview tab is open', () => {
    component.selectTab('preview');
    service.getPreview.calls.reset();

    component.reload();

    expect(service.getPreview).toHaveBeenCalledTimes(1);
  });

  it('shows an error when the preview cannot be rendered', () => {
    service.getPreview.and.returnValue(throwError(() => ({ error: { message: 'Nope' } })));

    component.loadPreview();

    expect(component.errors()).toEqual(['Nope']);
  });

  it('loads versions when their tab opens', () => {
    component.selectTab('versions');

    expect(component.versions()).toEqual([version]);
  });

  it('shows an error when versions cannot be loaded', () => {
    service.getVersions.and.returnValue(throwError(() => ({})));

    component.loadVersions();

    expect(component.errors().length).toBe(1);
  });

  it('publishes with a trimmed note and reminds the admin to restart', () => {
    service.publish.and.returnValue(of(version));

    component.openPublish();
    component.publishNote.set('  first cut  ');
    component.publish();

    expect(service.publish).toHaveBeenCalledWith('first cut');
    expect(component.publishOpen()).toBeFalse();
    expect(component.publishedMessage()).toContain('Version 2 published');
    expect(service.getDraft).toHaveBeenCalledTimes(2);
  });

  it('publishes without a note and refreshes versions when that tab is open', () => {
    service.publish.and.returnValue(of(version));
    component.selectTab('versions');
    service.getVersions.calls.reset();

    component.publish();

    expect(service.publish).toHaveBeenCalledWith(null);
    expect(service.getVersions).toHaveBeenCalled();
  });

  it('keeps the publish panel data and shows the problems when publishing fails', () => {
    service.publish.and.returnValue(throwError(() => ({ error: { message: 'Cannot publish', details: { a: 'Rule 2 missing' } } })));

    component.publish();

    expect(component.publishing()).toBeFalse();
    expect(component.errors()).toEqual(['Cannot publish', 'Rule 2 missing']);
  });

  it('cancels publishing', () => {
    component.openPublish();
    component.cancelPublish();

    expect(component.publishOpen()).toBeFalse();
  });

  it('shows the full prompt of a version and closes it again', () => {
    service.getVersion.and.returnValue(of({ ...version, renderedPrompt: 'OLD PROMPT' }));

    component.viewVersion(version);
    expect(component.selectedVersion()?.renderedPrompt).toBe('OLD PROMPT');

    component.closeVersion();
    expect(component.selectedVersion()).toBeNull();
  });

  it('shows an error when a version cannot be opened', () => {
    service.getVersion.and.returnValue(throwError(() => ({})));

    component.viewVersion(version);

    expect(component.errors().length).toBe(1);
  });

  it('restores a version into the draft', () => {
    service.restoreToDraft.and.returnValue(of(undefined));

    component.restore(version);

    expect(service.restoreToDraft).toHaveBeenCalledWith(2);
    expect(component.restoring()).toBeFalse();
    expect(component.publishedMessage()).toContain('copied into the draft');
  });

  it('shows an error when a version cannot be restored', () => {
    service.restoreToDraft.and.returnValue(throwError(() => ({})));

    component.restore(version);

    expect(component.restoring()).toBeFalse();
    expect(component.errors().length).toBe(1);
  });
});
