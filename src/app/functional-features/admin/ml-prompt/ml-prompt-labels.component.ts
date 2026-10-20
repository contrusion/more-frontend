import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MlEventLabel, MlLabelGroup } from './ml-prompt.model';
import { MlPromptService } from './ml-prompt.service';
import { extractErrorMessages } from './ml-prompt-error.util';

type LabelView = 'groups' | 'hierarchy';

export function parseAliases(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0);
}

@Component({
  selector: 'app-ml-prompt-labels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet, ReactiveFormsModule, ButtonModule, CheckboxModule, InputTextModule,
    SelectModule, TagModule, TextareaModule, TooltipModule
  ],
  templateUrl: './ml-prompt-labels.component.html',
  styleUrls: ['./ml-prompt-shared.css', './ml-prompt-labels.component.css']
})
export class MlPromptLabelsComponent {
  private readonly service = inject(MlPromptService);
  private readonly fb = inject(FormBuilder);

  readonly groups = input.required<MlLabelGroup[]>();
  readonly labels = input.required<MlEventLabel[]>();
  readonly changed = output<void>();

  readonly view = signal<LabelView>('groups');
  readonly errors = signal<string[]>([]);
  readonly busy = signal(false);
  readonly editingGroupId = signal<string | 'new' | null>(null);
  readonly editingLabelId = signal<string | 'new' | null>(null);
  readonly confirmDeleteKey = signal<string | null>(null);

  readonly groupOptions = computed(() => this.groups().map(group => ({ label: group.name, value: group.id })));

  readonly grouped = computed(() =>
    [...this.groups()]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(group => ({
        group,
        labels: this.labels().filter(label => label.groupId === group.id).sort((a, b) => a.sortOrder - b.sortOrder)
      })));

  readonly hierarchy = computed(() => [...this.labels()].sort((a, b) => a.priority - b.priority));

  /** Active labels the backend cannot store yet; publishing is blocked until a developer adds the enum constant. */
  readonly unsupportedLabels = computed(() => this.labels().filter(label => label.active && !label.codeSupported));

  readonly groupForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    intro: ['']
  });

  readonly labelForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    displayName: ['', [Validators.required, Validators.maxLength(255)]],
    groupId: ['', [Validators.required]],
    definition: ['', [Validators.required, Validators.maxLength(20000)]],
    active: [true],
    aliases: ['']
  });

  setView(view: LabelView): void {
    this.view.set(view);
    this.cancelEdits();
  }

  // ---- groups ----

  startAddGroup(): void {
    this.cancelEdits();
    this.groupForm.reset({ name: '', intro: '' });
    this.editingGroupId.set('new');
  }

  startEditGroup(group: MlLabelGroup): void {
    this.cancelEdits();
    this.groupForm.reset({ name: group.name, intro: group.intro ?? '' });
    this.editingGroupId.set(group.id);
  }

  saveGroup(): void {
    const id = this.editingGroupId();
    if (!id || this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }
    const value = this.groupForm.getRawValue();
    const request = { name: value.name.trim(), intro: value.intro.trim() || null };
    const call = id === 'new' ? this.service.createGroup(request) : this.service.updateGroup(id, request);
    this.run(call, 'Could not save the group.', () => this.editingGroupId.set(null));
  }

  moveGroup(index: number, delta: number): void {
    const ids = this.grouped().map(entry => entry.group.id);
    this.swapAndSave(ids, index, delta, order => this.service.reorderGroups(order), 'Could not reorder the groups.');
  }

  deleteGroup(id: string): void {
    this.run(this.service.deleteGroup(id), 'Could not delete the group.', () => this.confirmDeleteKey.set(null));
  }

  // ---- labels ----

  startAddLabel(groupId: string): void {
    this.cancelEdits();
    this.labelForm.reset({ name: '', displayName: '', groupId, definition: '', active: true, aliases: '' });
    this.labelForm.controls.name.enable();
    this.editingLabelId.set('new');
  }

  startEditLabel(label: MlEventLabel): void {
    this.cancelEdits();
    this.labelForm.reset({
      name: label.name,
      displayName: label.displayName,
      groupId: label.groupId,
      definition: label.definition,
      active: label.active,
      aliases: label.aliases.join(', ')
    });
    this.editingLabelId.set(label.id);
  }

  saveLabel(): void {
    const id = this.editingLabelId();
    if (!id || this.labelForm.invalid) {
      this.labelForm.markAllAsTouched();
      return;
    }
    const value = this.labelForm.getRawValue();
    const request = {
      name: value.name.trim(),
      displayName: value.displayName.trim(),
      groupId: value.groupId,
      definition: value.definition.trim(),
      active: value.active,
      aliases: parseAliases(value.aliases)
    };
    const call = id === 'new' ? this.service.createLabel(request) : this.service.updateLabel(id, request);
    this.run(call, 'Could not save the label.', () => this.editingLabelId.set(null));
  }

  moveLabel(groupId: string, index: number, delta: number): void {
    const entry = this.grouped().find(candidate => candidate.group.id === groupId);
    if (!entry) {
      return;
    }
    const ids = entry.labels.map(label => label.id);
    this.swapAndSave(ids, index, delta, order => this.service.reorderLabelsInGroup(groupId, order),
      'Could not reorder the labels.');
  }

  moveInHierarchy(index: number, delta: number): void {
    const ids = this.hierarchy().map(label => label.id);
    this.swapAndSave(ids, index, delta, order => this.service.reorderHierarchy(order),
      'Could not change the hierarchy.');
  }

  deleteLabel(id: string): void {
    this.run(this.service.deleteLabel(id), 'Could not delete the label.', () => this.confirmDeleteKey.set(null));
  }

  // ---- shared ----

  askDelete(key: string): void {
    this.confirmDeleteKey.set(key);
  }

  cancelDelete(): void {
    this.confirmDeleteKey.set(null);
  }

  cancelEdits(): void {
    this.editingGroupId.set(null);
    this.editingLabelId.set(null);
    this.confirmDeleteKey.set(null);
  }

  private swapAndSave(
    ids: string[], index: number, delta: number,
    save: (order: string[]) => Observable<void>, fallback: string
  ): void {
    const target = index + delta;
    if (target < 0 || target >= ids.length) {
      return;
    }
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.run(save(ids), fallback);
  }

  private run(call: Observable<unknown>, fallback: string, onSuccess?: () => void): void {
    this.busy.set(true);
    this.errors.set([]);
    call.subscribe({
      next: () => {
        this.busy.set(false);
        onSuccess?.();
        this.changed.emit();
      },
      error: err => {
        this.busy.set(false);
        this.errors.set(extractErrorMessages(err, fallback));
      }
    });
  }
}
