import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MlPromptLabelsComponent, parseAliases } from './ml-prompt-labels.component';
import { MlPromptService } from './ml-prompt.service';
import { MlEventLabel, MlLabelGroup } from './ml-prompt.model';

describe('parseAliases', () => {
  it('splits on commas and whitespace and drops blanks', () => {
    expect(parseAliases('A, B  C,,\nD ')).toEqual(['A', 'B', 'C', 'D']);
    expect(parseAliases('   ')).toEqual([]);
  });
});

describe('MlPromptLabelsComponent', () => {
  let fixture: ComponentFixture<MlPromptLabelsComponent>;
  let component: MlPromptLabelsComponent;
  let service: jasmine.SpyObj<MlPromptService>;

  const groups: MlLabelGroup[] = [
    { id: 'g2', name: 'Interview', intro: 'Interview steps', sortOrder: 2 },
    { id: 'g1', name: 'Documents', intro: null, sortOrder: 1 }
  ];

  const label = (id: string, name: string, groupId: string, sortOrder: number, priority: number, active = true, codeSupported = true): MlEventLabel => ({
    id, name, displayName: name, groupId, groupName: groupId === 'g1' ? 'Documents' : 'Interview',
    definition: 'definition', priority, sortOrder, active, aliases: name === 'CV_SUBMITTED' ? ['CV_SUBMITED'] : [], codeSupported
  });

  const labels: MlEventLabel[] = [
    label('l2', 'CV_SUBMITTED', 'g1', 2, 3),
    label('l1', 'CV_REQUEST', 'g1', 1, 1),
    label('l3', 'INTERVIEW_INVITE', 'g2', 1, 2, false)
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj('MlPromptService', [
      'createGroup', 'updateGroup', 'deleteGroup', 'reorderGroups',
      'createLabel', 'updateLabel', 'deleteLabel', 'reorderLabelsInGroup', 'reorderHierarchy'
    ]);
    await TestBed.configureTestingModule({ imports: [MlPromptLabelsComponent] })
      .overrideProvider(MlPromptService, { useValue: service })
      .compileComponents();

    fixture = TestBed.createComponent(MlPromptLabelsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('groups', groups);
    fixture.componentRef.setInput('labels', labels);
    fixture.detectChanges();
  });

  it('lists groups and labels in their configured order', () => {
    expect(component.grouped().map(entry => entry.group.id)).toEqual(['g1', 'g2']);
    expect(component.grouped()[0].labels.map(entry => entry.name)).toEqual(['CV_REQUEST', 'CV_SUBMITTED']);
    expect(fixture.nativeElement.textContent).toContain('CV_SUBMITED');
    expect(fixture.nativeElement.textContent).toContain('Inactive');
  });

  it('does not warn when every active label has an enum constant', () => {
    expect(component.unsupportedLabels()).toEqual([]);
    expect(fixture.nativeElement.textContent).not.toContain('Needs a developer');
  });

  it('warns about active labels without an enum constant, but not inactive ones', () => {
    fixture.componentRef.setInput('labels', [
      ...labels,
      label('l4', 'BRAND_NEW_LABEL', 'g1', 3, 4, true, false),
      label('l5', 'RETIRED_LABEL', 'g1', 4, 5, false, false)
    ]);
    fixture.detectChanges();

    expect(component.unsupportedLabels().map(entry => entry.name)).toEqual(['BRAND_NEW_LABEL']);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Needs a developer before it can be published');
    expect(text).toContain('no matching event type in the application');
    expect(text).not.toContain('InteractionEventType');
    expect(text).toContain('Needs code change');
    expect(text).not.toContain('RETIRED_LABEL.');
  });

  it('orders the hierarchy by priority', () => {
    expect(component.hierarchy().map(entry => entry.name)).toEqual(['CV_REQUEST', 'INTERVIEW_INVITE', 'CV_SUBMITTED']);

    component.setView('hierarchy');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Label hierarchy');
  });

  it('creates a group', () => {
    service.createGroup.and.returnValue(of(groups[0]));
    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.startAddGroup();
    component.groupForm.patchValue({ name: ' Offers ', intro: '' });
    component.saveGroup();

    expect(service.createGroup).toHaveBeenCalledWith({ name: 'Offers', intro: null });
    expect(component.editingGroupId()).toBeNull();
    expect(changed).toHaveBeenCalled();
  });

  it('updates a group', () => {
    service.updateGroup.and.returnValue(of(groups[0]));

    component.startEditGroup(groups[0]);
    component.groupForm.patchValue({ name: 'Interviews' });
    component.saveGroup();

    expect(service.updateGroup).toHaveBeenCalledWith('g2', { name: 'Interviews', intro: 'Interview steps' });
  });

  it('does not save a group without a name', () => {
    component.startAddGroup();
    component.saveGroup();

    expect(service.createGroup).not.toHaveBeenCalled();
    expect(component.groupForm.controls.name.touched).toBeTrue();
  });

  it('ignores group save when nothing is being edited', () => {
    component.saveGroup();

    expect(service.createGroup).not.toHaveBeenCalled();
  });

  it('reorders groups', () => {
    service.reorderGroups.and.returnValue(of(undefined));

    component.moveGroup(0, 1);

    expect(service.reorderGroups).toHaveBeenCalledWith(['g2', 'g1']);
  });

  it('shows the backend message when a non-empty group cannot be deleted', () => {
    service.deleteGroup.and.returnValue(throwError(() => ({ error: { message: 'Group still has labels' } })));

    component.askDelete('group:g1');
    component.deleteGroup('g1');

    expect(component.errors()).toEqual(['Group still has labels']);
  });

  it('deletes an empty group after confirmation', () => {
    service.deleteGroup.and.returnValue(of(undefined));

    component.askDelete('group:g2');
    component.deleteGroup('g2');

    expect(service.deleteGroup).toHaveBeenCalledWith('g2');
    expect(component.confirmDeleteKey()).toBeNull();
  });

  it('creates a label with parsed aliases', () => {
    service.createLabel.and.returnValue(of(labels[0]));

    component.startAddLabel('g1');
    component.labelForm.patchValue({
      name: 'CV_ASKED', displayName: 'CV asked', definition: 'When a CV is asked for', aliases: 'CV_ASK, CV_ASKING'
    });
    component.saveLabel();

    expect(service.createLabel).toHaveBeenCalledWith({
      name: 'CV_ASKED', displayName: 'CV asked', groupId: 'g1',
      definition: 'When a CV is asked for', active: true, aliases: ['CV_ASK', 'CV_ASKING']
    });
    expect(component.editingLabelId()).toBeNull();
  });

  it('updates a label and prefills its aliases', () => {
    service.updateLabel.and.returnValue(of(labels[0]));

    component.startEditLabel(labels[0]);
    expect(component.labelForm.getRawValue().aliases).toBe('CV_SUBMITED');
    component.labelForm.patchValue({ active: false });
    component.saveLabel();

    expect(service.updateLabel).toHaveBeenCalledWith('l2', jasmine.objectContaining({ name: 'CV_SUBMITTED', active: false }));
  });

  it('rejects label names that are not upper snake case', () => {
    component.startAddLabel('g1');
    component.labelForm.patchValue({ name: 'cv request', displayName: 'd', definition: 'x' });
    component.saveLabel();

    expect(component.labelForm.controls.name.invalid).toBeTrue();
    expect(service.createLabel).not.toHaveBeenCalled();
  });

  it('ignores label save when nothing is being edited', () => {
    component.saveLabel();

    expect(service.createLabel).not.toHaveBeenCalled();
  });

  it('reorders labels inside a group', () => {
    service.reorderLabelsInGroup.and.returnValue(of(undefined));

    component.moveLabel('g1', 0, 1);

    expect(service.reorderLabelsInGroup).toHaveBeenCalledWith('g1', ['l2', 'l1']);
  });

  it('ignores reordering an unknown group', () => {
    component.moveLabel('missing', 0, 1);

    expect(service.reorderLabelsInGroup).not.toHaveBeenCalled();
  });

  it('changes the hierarchy and ignores moves past the ends', () => {
    service.reorderHierarchy.and.returnValue(of(undefined));

    component.moveInHierarchy(0, -1);
    expect(service.reorderHierarchy).not.toHaveBeenCalled();

    component.moveInHierarchy(0, 1);
    expect(service.reorderHierarchy).toHaveBeenCalledWith(['l3', 'l1', 'l2']);
  });

  it('deletes a label after confirmation', () => {
    service.deleteLabel.and.returnValue(of(undefined));

    component.askDelete('label:l1');
    expect(component.confirmDeleteKey()).toBe('label:l1');
    component.cancelDelete();
    expect(component.confirmDeleteKey()).toBeNull();

    component.deleteLabel('l1');

    expect(service.deleteLabel).toHaveBeenCalledWith('l1');
  });
});
