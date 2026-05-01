import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CandidateSkillService } from '../services/candidate-skill.service';
import { CandidateSkill, UpdateSkillRequest, ProficiencyLevel } from '../models/goal.model';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css']
})
export class SkillsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  items: CandidateSkill[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  editingItem: CandidateSkill | null = null;
  editForm: UpdateSkillRequest = {};

  // For adding a new skill by ID (user looks up skill IDs from a separate skills catalogue)
  addSkillId = '';
  addProficiency: ProficiencyLevel = 'INTERMEDIATE';
  addYears: number | undefined;
  addIncludeInCv = true;
  showAddForm = false;

  readonly proficiencyLevels: { value: ProficiencyLevel; label: string }[] = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  constructor(private service: CandidateSkillService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.items = data; this.isLoading = false; },
        error: () => { this.errorMessage = 'Failed to load skills.'; this.isLoading = false; }
      });
  }

  openAdd(): void { this.addSkillId = ''; this.addProficiency = 'INTERMEDIATE'; this.addYears = undefined; this.addIncludeInCv = true; this.showAddForm = true; }
  cancelAdd(): void { this.showAddForm = false; }

  add(): void {
    this.service.add({ skillId: this.addSkillId, proficiencyLevel: this.addProficiency, yearsExperience: this.addYears, includeInCv: this.addIncludeInCv })
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => { this.showAddForm = false; this.load(); }, error: (e) => { this.errorMessage = e.error?.message ?? 'Failed to add skill.'; } });
  }

  openEdit(item: CandidateSkill): void {
    this.editingItem = item;
    this.editForm = { proficiencyLevel: item.proficiencyLevel, yearsExperience: item.yearsExperience ?? undefined, includeInCv: item.includeInCv };
  }

  cancelEdit(): void { this.editingItem = null; }

  saveEdit(): void {
    if (!this.editingItem) return;
    this.service.update(this.editingItem.id, this.editForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => { this.editingItem = null; this.load(); }, error: () => { this.errorMessage = 'Failed to save.'; } });
  }

  remove(item: CandidateSkill): void {
    if (!confirm(`Remove "${item.skillName}" from your profile?`)) return;
    this.service.remove(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.load(), error: () => { this.errorMessage = 'Failed to remove.'; } });
  }

  getProficiencyLabel(level: ProficiencyLevel): string {
    return this.proficiencyLevels.find(p => p.value === level)?.label ?? level;
  }
}
