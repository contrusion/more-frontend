import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MlPromptSectionsComponent } from './ml-prompt-sections.component';
import { MlPromptService } from './ml-prompt.service';
import { MlPromptSection } from './ml-prompt.model';

describe('MlPromptSectionsComponent', () => {
  let fixture: ComponentFixture<MlPromptSectionsComponent>;
  let component: MlPromptSectionsComponent;
  let service: jasmine.SpyObj<MlPromptService>;

  const sections: MlPromptSection[] = [
    { id: 's1', type: 'INSTRUCTION', supportsItems: false, heading: 'Role', intro: 'You help.', items: [] },
    {
      id: 's2', type: 'RULES', supportsItems: true, heading: 'Rules', intro: null,
      items: [
        { id: 'i1', title: null, content: 'First rule', sortOrder: 1, active: true },
        { id: 'i2', title: 'Second', content: 'Second rule', sortOrder: 2, active: false }
      ]
    }
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', [
      'updateSection', 'addItem', 'updateItem', 'deleteItem', 'reorderItems'
    ]);
    await TestBed.configureTestingModule({ imports: [MlPromptSectionsComponent] })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    fixture = TestBed.createComponent(MlPromptSectionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sections', sections);
    fixture.detectChanges();
  });

  it('renders every section and its entries', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('section.panel').length).toBe(2);
    expect(element.querySelectorAll('li.row').length).toBe(2);
    expect(element.textContent).toContain('Hidden from prompt');
  });

  it('saves section text, trimming blanks to null', () => {
    service.updateSection.and.returnValue(of(sections[0]));
    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.saveSection(sections[1], '  Rules  ', '   ');

    expect(service.updateSection).toHaveBeenCalledWith('RULES', { heading: 'Rules', intro: null });
    expect(changed).toHaveBeenCalled();
  });

  it('shows the backend message when saving a section fails', () => {
    service.updateSection.and.returnValue(throwError(() => ({ error: { message: 'Heading too long' } })));

    component.saveSection(sections[0], 'x', 'y');

    expect(component.errors()).toEqual(['Heading too long']);
    expect(component.busy()).toBeFalse();
  });

  it('adds a new entry', () => {
    service.addItem.and.returnValue(of(sections[1].items[0]));
    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.startAdd('RULES');
    expect(component.editing()).toEqual({ sectionType: 'RULES', itemId: null });
    component.itemForm.patchValue({ title: ' ', content: ' New rule ' });
    component.saveItem();

    expect(service.addItem).toHaveBeenCalledWith('RULES', { title: null, content: 'New rule', active: true });
    expect(component.editing()).toBeNull();
    expect(changed).toHaveBeenCalled();
  });

  it('edits an existing entry', () => {
    service.updateItem.and.returnValue(of(sections[1].items[1]));

    component.startEdit('RULES', sections[1].items[1]);
    expect(component.itemForm.getRawValue()).toEqual({ title: 'Second', content: 'Second rule', active: false });
    component.itemForm.patchValue({ active: true });
    component.saveItem();

    expect(service.updateItem).toHaveBeenCalledWith('i2', { title: 'Second', content: 'Second rule', active: true });
  });

  it('does not save an entry without content', () => {
    component.startAdd('RULES');
    component.saveItem();

    expect(service.addItem).not.toHaveBeenCalled();
    expect(component.itemForm.controls.content.touched).toBeTrue();
  });

  it('ignores save when nothing is being edited', () => {
    component.saveItem();

    expect(service.addItem).not.toHaveBeenCalled();
    expect(service.updateItem).not.toHaveBeenCalled();
  });

  it('cancels editing', () => {
    component.startAdd('RULES');
    component.cancelEdit();

    expect(component.editing()).toBeNull();
  });

  it('reorders entries by swapping neighbours', () => {
    service.reorderItems.and.returnValue(of(undefined));

    component.move(sections[1], 0, 1);

    expect(service.reorderItems).toHaveBeenCalledWith('RULES', ['i2', 'i1']);
  });

  it('does not reorder past either end', () => {
    component.move(sections[1], 0, -1);
    component.move(sections[1], 1, 1);

    expect(service.reorderItems).not.toHaveBeenCalled();
  });

  it('asks for confirmation before deleting an entry', () => {
    service.deleteItem.and.returnValue(of(undefined));

    component.askDelete('i1');
    expect(component.confirmDeleteId()).toBe('i1');
    component.cancelDelete();
    expect(component.confirmDeleteId()).toBeNull();

    component.askDelete('i1');
    component.confirmDelete('i1');

    expect(service.deleteItem).toHaveBeenCalledWith('i1');
    expect(component.confirmDeleteId()).toBeNull();
  });
});
