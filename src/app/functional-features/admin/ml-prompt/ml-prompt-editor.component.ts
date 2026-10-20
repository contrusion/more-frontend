import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MlPromptDraft, MlPromptPreview, MlPromptStatus, MlPromptVersion } from './ml-prompt.model';
import { MlPromptService } from './ml-prompt.service';
import { extractErrorMessages } from './ml-prompt-error.util';
import { MlPromptSectionsComponent } from './ml-prompt-sections.component';
import { MlPromptLabelsComponent } from './ml-prompt-labels.component';

export type PromptTab = 'sections' | 'labels' | 'preview' | 'versions';

@Component({
  selector: 'app-ml-prompt-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, ButtonModule, RouterLink, TagModule, TextareaModule,
    MlPromptSectionsComponent, MlPromptLabelsComponent
  ],
  templateUrl: './ml-prompt-editor.component.html',
  styleUrls: ['./ml-prompt-shared.css', './ml-prompt-editor.component.css']
})
export class MlPromptEditorComponent implements OnInit {
  private readonly service = inject(MlPromptService);

  readonly tabs: { id: PromptTab; label: string }[] = [
    { id: 'sections', label: 'Prompt text' },
    { id: 'labels', label: 'Labels' },
    { id: 'preview', label: 'Preview' },
    { id: 'versions', label: 'Versions' }
  ];

  readonly draft = signal<MlPromptDraft | null>(null);
  readonly status = signal<MlPromptStatus | null>(null);
  readonly tab = signal<PromptTab>('sections');
  readonly loading = signal(true);
  readonly errors = signal<string[]>([]);

  readonly preview = signal<MlPromptPreview | null>(null);
  readonly versions = signal<MlPromptVersion[]>([]);
  readonly selectedVersion = signal<MlPromptVersion | null>(null);

  readonly publishOpen = signal(false);
  readonly publishing = signal(false);
  readonly publishNote = signal('');
  readonly publishedMessage = signal<string | null>(null);
  readonly restoring = signal(false);

  /** Messages the model could not label with a published label; shared with the admin navigation badge. */
  readonly unreviewedCount = this.service.unreviewedCount;

  readonly sections = computed(() => this.draft()?.sections ?? []);
  readonly groups = computed(() => this.draft()?.groups ?? []);
  readonly labels = computed(() => this.draft()?.labels ?? []);
  readonly canPublish = computed(() => {
    const status = this.status();
    return !!status && status.unpublishedChanges && status.validationErrors.length === 0;
  });

  ngOnInit(): void {
    this.reload(true);
    this.service.getUnknownSummary().subscribe({ error: () => undefined });
  }

  reload(showSpinner = false): void {
    if (showSpinner) {
      this.loading.set(true);
    }
    forkJoin({ draft: this.service.getDraft(), status: this.service.getStatus() }).subscribe({
      next: ({ draft, status }) => {
        this.draft.set(draft);
        this.status.set(status);
        this.loading.set(false);
        if (this.tab() === 'preview') {
          this.loadPreview();
        }
      },
      error: err => {
        this.errors.set(extractErrorMessages(err, 'Failed to load the prompt. Please try again.'));
        this.loading.set(false);
      }
    });
  }

  selectTab(tab: PromptTab): void {
    this.tab.set(tab);
    if (tab === 'preview') {
      this.loadPreview();
    } else if (tab === 'versions') {
      this.loadVersions();
    }
  }

  loadPreview(): void {
    this.service.getPreview().subscribe({
      next: preview => this.preview.set(preview),
      error: err => this.errors.set(extractErrorMessages(err, 'Could not render the preview.'))
    });
  }

  loadVersions(): void {
    this.service.getVersions().subscribe({
      next: versions => this.versions.set(versions),
      error: err => this.errors.set(extractErrorMessages(err, 'Could not load the version history.'))
    });
  }

  openPublish(): void {
    this.publishNote.set('');
    this.publishedMessage.set(null);
    this.publishOpen.set(true);
  }

  cancelPublish(): void {
    this.publishOpen.set(false);
  }

  publish(): void {
    this.publishing.set(true);
    this.errors.set([]);
    const note = this.publishNote().trim();
    this.service.publish(note || null).subscribe({
      next: version => {
        this.publishing.set(false);
        this.publishOpen.set(false);
        this.publishedMessage.set(
          `Version ${version.versionNumber} published. Restart the API for it to take effect.`);
        this.reload();
        if (this.tab() === 'versions') {
          this.loadVersions();
        }
      },
      error: err => {
        this.publishing.set(false);
        this.errors.set(extractErrorMessages(err, 'Publishing failed.'));
      }
    });
  }

  viewVersion(version: MlPromptVersion): void {
    this.service.getVersion(version.versionNumber).subscribe({
      next: full => this.selectedVersion.set(full),
      error: err => this.errors.set(extractErrorMessages(err, 'Could not load that version.'))
    });
  }

  closeVersion(): void {
    this.selectedVersion.set(null);
  }

  restore(version: MlPromptVersion): void {
    this.restoring.set(true);
    this.errors.set([]);
    this.service.restoreToDraft(version.versionNumber).subscribe({
      next: () => {
        this.restoring.set(false);
        this.publishedMessage.set(
          `Version ${version.versionNumber} copied into the draft. Review it and publish to use it.`);
        this.reload();
      },
      error: err => {
        this.restoring.set(false);
        this.errors.set(extractErrorMessages(err, 'Could not restore that version.'));
      }
    });
  }
}
