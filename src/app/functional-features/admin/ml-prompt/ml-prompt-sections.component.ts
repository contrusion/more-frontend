import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MlPromptItem, MlPromptSection, MlPromptSectionType } from './ml-prompt.model';
import { MlPromptService } from './ml-prompt.service';
import { extractErrorMessages } from './ml-prompt-error.util';

interface ItemEditState {
  sectionType: MlPromptSectionType;
  itemId: string | null;
}

export const SECTION_TITLES: Record<MlPromptSectionType, { title: string; hint: string }> = {
  INSTRUCTION: { title: 'Instruction', hint: 'Opening paragraph that tells the model what its job is.' },
  RULES: { title: 'Rules', hint: 'Numbered rules. Use {{label:NAME}} to reference a label; it is checked on publish.' },
  OUTPUT_FORMAT: { title: 'Output format', hint: 'Describes the JSON the model must return.' },
  FIELD_SPECS: { title: 'Field specifications', hint: 'One entry per JSON field the model fills in.' },
  LABEL_TYPES: { title: 'Label types', hint: 'Explains how primary and additional labels differ.' },
  LABEL_BOUNDARIES: { title: 'Label boundaries', hint: 'Guidance for telling similar labels apart.' },
  HIERARCHY: { title: 'Label hierarchy', hint: 'Introduction above the generated priority list. The order itself is set on the Labels tab.' }
};

@Component({
  selector: 'app-ml-prompt-sections',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, CheckboxModule, InputTextModule, TagModule, TextareaModule, TooltipModule],
  templateUrl: './ml-prompt-sections.component.html',
  styleUrls: ['./ml-prompt-shared.css', './ml-prompt-sections.component.css']
})
export class MlPromptSectionsComponent {
  private readonly service = inject(MlPromptService);
  private readonly fb = inject(FormBuilder);

  readonly sections = input.required<MlPromptSection[]>();
  readonly changed = output<void>();

  readonly titles = SECTION_TITLES;
  readonly errors = signal<string[]>([]);
  readonly busy = signal(false);
  readonly editing = signal<ItemEditState | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly itemForm = this.fb.nonNullable.group({
    title: ['', [Validators.maxLength(255)]],
    content: ['', [Validators.required, Validators.maxLength(20000)]],
    active: [true]
  });

  saveSection(section: MlPromptSection, heading: string, intro: string): void {
    this.run(
      this.service.updateSection(section.type, { heading: heading.trim() || null, intro: intro.trim() || null }),
      'Could not save the section.'
    );
  }

  startAdd(type: MlPromptSectionType): void {
    this.itemForm.reset({ title: '', content: '', active: true });
    this.editing.set({ sectionType: type, itemId: null });
    this.errors.set([]);
  }

  startEdit(type: MlPromptSectionType, item: MlPromptItem): void {
    this.itemForm.reset({ title: item.title ?? '', content: item.content, active: item.active });
    this.editing.set({ sectionType: type, itemId: item.id });
    this.errors.set([]);
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  saveItem(): void {
    const state = this.editing();
    if (!state || this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const value = this.itemForm.getRawValue();
    const request = { title: value.title.trim() || null, content: value.content.trim(), active: value.active };
    const call = state.itemId
      ? this.service.updateItem(state.itemId, request)
      : this.service.addItem(state.sectionType, request);
    this.run(call, 'Could not save the entry.', () => this.editing.set(null));
  }

  move(section: MlPromptSection, index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= section.items.length) {
      return;
    }
    const ids = section.items.map(item => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.run(this.service.reorderItems(section.type, ids), 'Could not reorder the entries.');
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: string): void {
    this.run(this.service.deleteItem(id), 'Could not delete the entry.', () => this.confirmDeleteId.set(null));
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
