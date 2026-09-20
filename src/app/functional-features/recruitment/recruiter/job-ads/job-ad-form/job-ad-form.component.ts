import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobAdService } from '../services/job-ad.service';
import {
  AvailableBenefit,
  AvailableSkill,
  ExperienceLevel,
  ImportanceLevel,
  JobAdvertisement,
  JobAdvertisementCreateRequest,
  JobAdvertisementUpdateRequest,
  JobType,
} from '../models/job-advertisement.model';

@Component({
  selector: 'app-job-ad-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-backdrop" (click)="cancel()"></div>
<div class="modal-panel" role="dialog" aria-modal="true">

  <div class="modal-header">
    <h2>{{ editAd ? 'Edit Job Ad' : 'Post a Job Ad' }}</h2>
    <button class="close-btn" (click)="cancel()" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  @if (error()) {
    <div class="form-error">{{ error() }}</div>
  }

  <div class="modal-body">

    <section class="form-section">
      <h3 class="section-title">Basic Details</h3>
      <div class="form-group">
        <label>Job Title <span class="req">*</span></label>
        <input type="text" [(ngModel)]="title" placeholder="e.g. Senior Java Developer" maxlength="255"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Job Type <span class="req">*</span></label>
          <select [(ngModel)]="jobType">
            @for (jt of jobTypes; track jt) {
              <option [value]="jt">{{ labelFor(jt) }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Experience Level <span class="req">*</span></label>
          <select [(ngModel)]="experienceLevel">
            @for (el of experienceLevels; track el) {
              <option [value]="el">{{ labelFor(el) }}</option>
            }
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Location <span class="req">*</span></label>
          <input type="text" [(ngModel)]="location" placeholder="e.g. Cape Town, South Africa"/>
        </div>
        <div class="form-group">
          <label>Department</label>
          <input type="text" [(ngModel)]="department" placeholder="e.g. Engineering"/>
        </div>
      </div>
      <div class="form-group">
        <label>Description <span class="req">*</span></label>
        <textarea [(ngModel)]="description" rows="5" placeholder="Describe the role, responsibilities and what makes it great…"></textarea>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Compensation</h3>
      <div class="form-row three-col">
        <div class="form-group">
          <label>Min Salary</label>
          <input type="number" [(ngModel)]="salaryMin" placeholder="e.g. 40000" min="0"/>
        </div>
        <div class="form-group">
          <label>Max Salary</label>
          <input type="number" [(ngModel)]="salaryMax" placeholder="e.g. 80000" min="0"/>
        </div>
        <div class="form-group">
          <label>Currency</label>
          <input type="text" [(ngModel)]="currency" placeholder="ZAR" maxlength="10"/>
        </div>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Dates &amp; Status</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Closing Date <span class="req">*</span></label>
          <input type="date" [(ngModel)]="closingDate"/>
        </div>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="isActive"/>
            <span>Active (visible to matched candidates)</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>Minimum Match Score (%)</label>
        <input type="number" [(ngModel)]="matchThreshold" min="0" max="100" placeholder="80"/>
        <p class="field-hint">Candidates below this score are redirected to career pathway activation instead of applying.</p>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Required &amp; Preferred Skills</h3>
      @if (loadingCatalogs()) {
        <p class="hint">Loading skills…</p>
      } @else {
        <div class="chip-picker">
          @for (skill of availableSkills(); track skill.id) {
            <button type="button" class="chip" [class.chip-selected]="isSkillSelected(skill.id)" (click)="addSkill(skill)">{{ skill.name }}</button>
          }
        </div>
        @if (selectedSkills.length > 0) {
          <div class="selected-skills">
            @for (sel of selectedSkills; track sel.skillId) {
              <div class="skill-row">
                <span class="skill-name">{{ sel.skillName }}</span>
                <select [(ngModel)]="sel.importanceLevel" class="importance-select">
                  @for (il of importanceLevels; track il) {
                    <option [value]="il">{{ labelFor(il) }}</option>
                  }
                </select>
                <input type="number" [(ngModel)]="sel.yearsRequired" placeholder="Years" min="0" max="30" class="years-input"/>
                <button type="button" class="remove-chip" (click)="removeSkill(sel.skillId)" aria-label="Remove">×</button>
              </div>
            }
          </div>
        }
      }
    </section>

    <section class="form-section">
      <h3 class="section-title">Benefits</h3>
      @if (loadingCatalogs()) {
        <p class="hint">Loading benefits…</p>
      } @else {
        <div class="chip-picker">
          @for (benefit of availableBenefits(); track benefit.id) {
            <button type="button" class="chip" [class.chip-selected]="isBenefitSelected(benefit.id)" (click)="toggleBenefit(benefit.id)">{{ benefit.name }}</button>
          }
        </div>
      }
    </section>

    <section class="form-section">
      <h3 class="section-title">Selection Criteria</h3>
      <p class="hint">Define who sees this advert. Unselected criteria apply no restriction.</p>

      <div class="form-group">
        <label class="criteria-label">Preferred Tiers</label>
        <p class="field-hint">Only candidates in the selected tiers will see this advert. Example: Gold + All‑Star → top‑tier only.</p>
        <div class="chip-picker">
          @for (tier of tierOptions; track tier) {
            <button type="button" class="chip" [class.chip-selected]="isTierSelected(tier)" (click)="toggleTier(tier)">{{ tier }}</button>
          }
        </div>
      </div>

      <div class="form-group">
        <label class="criteria-label">Company Alumni</label>
        <p class="field-hint">Prioritise candidates who have worked at these companies. Example: Ex‑Microsoft, Ex‑Standard Bank.</p>
        <div class="cert-input-row">
          <input type="text" [(ngModel)]="companyInput" placeholder="e.g. Microsoft, Standard Bank" (keydown.enter)="addCompany(); $event.preventDefault()"/>
          <button type="button" class="add-cert-btn" (click)="addCompany()">Add</button>
        </div>
        <div class="cert-chips">
          @for (c of companyAlumni; track c) {
            <span class="cert-chip">{{ c }}<button type="button" class="remove-chip" (click)="removeCompany(c)" aria-label="Remove">×</button></span>
          }
        </div>
      </div>

      <div class="form-group">
        <label class="criteria-label">Problem Domain</label>
        <p class="field-hint">Show advert to candidates with domain experience. Example: Finance + Health.</p>
        <div class="chip-picker">
          @for (domain of domainOptions; track domain) {
            <button type="button" class="chip" [class.chip-selected]="isDomainSelected(domain)" (click)="toggleDomain(domain)">{{ domain }}</button>
          }
        </div>
      </div>

      <div class="form-group">
        <label class="criteria-label">School Alumni</label>
        <p class="field-hint">Target candidates from specific academic institutions. Example: UCT, Wits, Stellenbosch.</p>
        <div class="cert-input-row">
          <input type="text" [(ngModel)]="schoolInput" placeholder="e.g. University of Cape Town, Wits" (keydown.enter)="addSchool(); $event.preventDefault()"/>
          <button type="button" class="add-cert-btn" (click)="addSchool()">Add</button>
        </div>
        <div class="cert-chips">
          @for (s of schoolAlumni; track s) {
            <span class="cert-chip">{{ s }}<button type="button" class="remove-chip" (click)="removeSchool(s)" aria-label="Remove">×</button></span>
          }
        </div>
      </div>

      <div class="form-group">
        <label class="criteria-label">Preferred Certifications</label>
        <p class="field-hint">Candidates with these certifications are prioritised. Example: AWS Certified Developer, CFA.</p>
        <div class="cert-input-row">
          <input type="text" [(ngModel)]="certInput" placeholder="e.g. AWS Certified Developer" (keydown.enter)="addCert(); $event.preventDefault()"/>
          <button type="button" class="add-cert-btn" (click)="addCert()">Add</button>
        </div>
        <div class="cert-chips">
          @for (cert of preferredCertifications; track cert) {
            <span class="cert-chip">{{ cert }}<button type="button" class="remove-chip" (click)="removeCert(cert)" aria-label="Remove">×</button></span>
          }
        </div>
      </div>

      <div class="form-group">
        <label class="criteria-label">Activity Recency (days)</label>
        <input type="number" [(ngModel)]="activityRecencyDays" placeholder="e.g. 90 — leave blank for no requirement" min="1"/>
        <p class="field-hint">Minimum days of recent platform activity required (optional).</p>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Application Details</h3>
      <div class="form-group">
        <label>External Job URL</label>
        <input type="url" [(ngModel)]="externalJobUrl" placeholder="https://careers.example.com/job/123"/>
      </div>
      <div class="form-group">
        <label>Application Instructions</label>
        <textarea [(ngModel)]="applicationInstructions" rows="3" placeholder="How should candidates apply?"></textarea>
      </div>
    </section>

  </div>

  <div class="modal-footer">
    <button class="btn-cancel" (click)="cancel()">Cancel</button>
    <button class="btn-submit" (click)="submit()" [disabled]="saving()">
      @if (saving()) { Saving… } @else { {{ editAd ? 'Save Changes' : 'Post Job Ad' }} }
    </button>
  </div>

</div>
  `,
  styles: [`
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 900;
  backdrop-filter: blur(2px);
}
.modal-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 680px;
  background: #0f172a;
  border-left: 1px solid rgba(249, 115, 22, 0.2);
  z-index: 901;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(249, 115, 22, 0.15);
  flex-shrink: 0;
}
.modal-header h2 { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.close-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.05); border: none; border-radius: 8px;
  color: rgba(255,255,255,0.6); cursor: pointer; transition: background 0.15s;
}
.close-btn:hover { background: rgba(255,255,255,0.12); }
.form-error {
  background: rgba(239,68,68,0.15);
  border-bottom: 1px solid rgba(239,68,68,0.3);
  color: #fca5a5;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  flex-shrink: 0;
}
.modal-body {
  flex: 1; overflow-y: auto; padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.75rem;
}
.form-section { display: flex; flex-direction: column; gap: 1rem; }
.section-title {
  font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #f97316; margin: 0;
  padding-bottom: 0.5rem; border-bottom: 1px solid rgba(249,115,22,0.2);
}
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-row.three-col { grid-template-columns: 1fr 1fr 0.6fr; }
label { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.7); }
.criteria-label { color: rgba(255,255,255,0.9); }
.req { color: #f97316; }
input[type='text'], input[type='number'], input[type='url'], input[type='date'], select, textarea {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; color: #f1f5f9;
  padding: 0.6rem 0.85rem; font-size: 0.88rem;
  transition: border-color 0.15s; width: 100%; box-sizing: border-box;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: #f97316; }
select option { background: #1e293b; }
textarea { resize: vertical; }
.hint { font-size: 0.82rem; color: rgba(255,255,255,0.4); margin: 0; }
.field-hint { font-size: 0.78rem; color: rgba(255,255,255,0.35); margin: 0.2rem 0 0; }
.checkbox-group { justify-content: flex-end; padding-top: 0.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.88rem; color: rgba(255,255,255,0.7); }
.checkbox-label input { width: auto; accent-color: #f97316; }
.chip-picker { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  padding: 0.3rem 0.75rem;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.6);
  border-radius: 9999px; font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
}
.chip:hover { border-color: #f97316; color: #f97316; }
.chip-selected { background: rgba(249,115,22,0.2); border-color: #f97316; color: #fb923c; }
.selected-skills { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.25rem; }
.skill-row {
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.18);
  border-radius: 8px; padding: 0.4rem 0.75rem;
}
.skill-name { flex: 1; font-size: 0.85rem; font-weight: 600; color: #fb923c; }
.importance-select { width: 140px; padding: 0.3rem 0.5rem; font-size: 0.78rem; }
.years-input { width: 70px; padding: 0.3rem 0.5rem; font-size: 0.78rem; text-align: center; }
.remove-chip {
  background: none; border: none; color: rgba(255,255,255,0.4);
  cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 0.2rem; transition: color 0.15s;
}
.remove-chip:hover { color: #f87171; }
.cert-input-row { display: flex; gap: 0.5rem; }
.cert-input-row input { flex: 1; }
.add-cert-btn {
  padding: 0.55rem 1rem;
  background: rgba(249,115,22,0.2); border: 1px solid rgba(249,115,22,0.4);
  color: #f97316; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.add-cert-btn:hover { background: rgba(249,115,22,0.3); }
.cert-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.cert-chip {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc; border-radius: 9999px; font-size: 0.78rem;
}
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 0.75rem; padding: 1rem 1.5rem;
  border-top: 1px solid rgba(249,115,22,0.15); flex-shrink: 0;
}
.btn-cancel {
  padding: 0.6rem 1.25rem; background: transparent;
  border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.6);
  border-radius: 9px; font-size: 0.875rem; cursor: pointer; transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: rgba(255,255,255,0.4); }
.btn-submit {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: none; color: white; border-radius: 9px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  `],
})
export class JobAdFormComponent implements OnInit, OnChanges {
  @Input() editAd: JobAdvertisement | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  saving = signal(false);
  error = signal<string | null>(null);

  availableSkills = signal<AvailableSkill[]>([]);
  availableBenefits = signal<AvailableBenefit[]>([]);
  loadingCatalogs = signal(true);

  // Form state
  title = '';
  description = '';
  location = '';
  department = '';
  jobType: JobType = JobType.FULL_TIME;
  experienceLevel: ExperienceLevel = ExperienceLevel.MID_LEVEL;
  salaryMin: number | null = null;
  salaryMax: number | null = null;
  currency = 'ZAR';
  closingDate = '';
  isActive = true;
  matchThreshold = 80;
  externalJobUrl = '';
  applicationInstructions = '';
  preferredCertifications: string[] = [];
  activityRecencyDays: number | null = null;
  certInput = '';

  selectedTiers: string[] = [];
  companyAlumni: string[] = [];
  companyInput = '';
  selectedDomains: string[] = [];
  schoolAlumni: string[] = [];
  schoolInput = '';

  selectedSkills: Array<{ skillId: string; skillName: string; importanceLevel: ImportanceLevel; yearsRequired: number | null }> = [];
  selectedBenefitIds: Set<string> = new Set();

  readonly jobTypes = Object.values(JobType);
  readonly experienceLevels = Object.values(ExperienceLevel);
  readonly importanceLevels = Object.values(ImportanceLevel);
  readonly tierOptions = ['Bronze', 'Silver', 'Gold', 'All-Star'];
  readonly domainOptions = ['Finance', 'Automotive', 'Health', 'Tech', 'Education', 'Retail', 'Legal', 'Construction', 'Government', 'NGO'];

  constructor(private jobAdService: JobAdService) {}

  ngOnInit(): void {
    this.loadCatalogs();
    if (this.editAd) {
      this.populateFromAd(this.editAd);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editAd'] && changes['editAd'].currentValue) {
      this.populateFromAd(changes['editAd'].currentValue);
    }
  }

  private populateFromAd(ad: JobAdvertisement): void {
    this.title = ad.title;
    this.description = ad.description;
    this.location = ad.location;
    this.department = ad.department ?? '';
    this.jobType = ad.jobType;
    this.experienceLevel = ad.experienceLevel;
    this.salaryMin = ad.salaryMin ?? null;
    this.salaryMax = ad.salaryMax ?? null;
    this.currency = ad.currency ?? 'ZAR';
    this.closingDate = ad.closingDate?.substring(0, 10) ?? '';
    this.isActive = ad.isActive;
    this.matchThreshold = ad.matchThreshold ?? 80;
    this.externalJobUrl = ad.externalJobUrl ?? '';
    this.applicationInstructions = ad.applicationInstructions ?? '';
    this.preferredCertifications = [...(ad.preferredCertifications ?? [])];
    this.activityRecencyDays = ad.activityRecencyDays ?? null;
    this.selectedSkills = (ad.skills ?? []).map(s => ({
      skillId: s.skillId,
      skillName: s.skillName,
      importanceLevel: s.importanceLevel,
      yearsRequired: s.yearsRequired ?? null,
    }));
    this.selectedBenefitIds = new Set((ad.benefits ?? []).map(b => b.benefitId));
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    let skillsDone = false;
    let benefitsDone = false;

    const checkDone = () => {
      if (skillsDone && benefitsDone) this.loadingCatalogs.set(false);
    };

    this.jobAdService.getAvailableSkills().subscribe({
      next: (s) => { this.availableSkills.set(s); skillsDone = true; checkDone(); },
      error: () => { skillsDone = true; checkDone(); },
    });

    this.jobAdService.getAvailableBenefits().subscribe({
      next: (b) => { this.availableBenefits.set(b); benefitsDone = true; checkDone(); },
      error: () => { benefitsDone = true; checkDone(); },
    });
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  addSkill(skill: AvailableSkill): void {
    if (this.selectedSkills.some(s => s.skillId === skill.id)) return;
    this.selectedSkills = [...this.selectedSkills, {
      skillId: skill.id,
      skillName: skill.name,
      importanceLevel: ImportanceLevel.REQUIRED,
      yearsRequired: null,
    }];
  }

  removeSkill(skillId: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s.skillId !== skillId);
  }

  isSkillSelected(id: string): boolean {
    return this.selectedSkills.some(s => s.skillId === id);
  }

  // ─── Benefits ─────────────────────────────────────────────────────────────

  toggleBenefit(id: string): void {
    const updated = new Set(this.selectedBenefitIds);
    if (updated.has(id)) { updated.delete(id); } else { updated.add(id); }
    this.selectedBenefitIds = updated;
  }

  isBenefitSelected(id: string): boolean {
    return this.selectedBenefitIds.has(id);
  }

  // ─── Certifications ───────────────────────────────────────────────────────

  addCert(): void {
    const v = this.certInput.trim();
    if (v && !this.preferredCertifications.includes(v)) {
      this.preferredCertifications = [...this.preferredCertifications, v];
    }
    this.certInput = '';
  }

  removeCert(cert: string): void {
    this.preferredCertifications = this.preferredCertifications.filter(c => c !== cert);
  }

  // ─── Tiers ────────────────────────────────────────────────────────────────

  toggleTier(tier: string): void {
    this.selectedTiers = this.selectedTiers.includes(tier)
      ? this.selectedTiers.filter(t => t !== tier)
      : [...this.selectedTiers, tier];
  }

  isTierSelected(tier: string): boolean { return this.selectedTiers.includes(tier); }

  // ─── Company Alumni ────────────────────────────────────────────────────────

  addCompany(): void {
    const v = this.companyInput.trim();
    if (v && !this.companyAlumni.includes(v)) { this.companyAlumni = [...this.companyAlumni, v]; }
    this.companyInput = '';
  }

  removeCompany(c: string): void { this.companyAlumni = this.companyAlumni.filter(x => x !== c); }

  // ─── Problem Domain ────────────────────────────────────────────────────────

  toggleDomain(domain: string): void {
    this.selectedDomains = this.selectedDomains.includes(domain)
      ? this.selectedDomains.filter(d => d !== domain)
      : [...this.selectedDomains, domain];
  }

  isDomainSelected(domain: string): boolean { return this.selectedDomains.includes(domain); }

  // ─── School Alumni ─────────────────────────────────────────────────────────

  addSchool(): void {
    const v = this.schoolInput.trim();
    if (v && !this.schoolAlumni.includes(v)) { this.schoolAlumni = [...this.schoolAlumni, v]; }
    this.schoolInput = '';
  }

  removeSchool(s: string): void { this.schoolAlumni = this.schoolAlumni.filter(x => x !== s); }

  // ─── Submit ───────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.title || !this.description || !this.location || !this.closingDate) {
      this.error.set('Title, description, location and closing date are required.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const skillsPayload = this.selectedSkills.map(s => ({
      skillId: s.skillId,
      importanceLevel: s.importanceLevel,
      yearsRequired: s.yearsRequired ?? undefined,
    }));

    if (this.editAd) {
      const dto: JobAdvertisementUpdateRequest = {
        title: this.title,
        description: this.description,
        location: this.location,
        department: this.department || undefined,
        jobType: this.jobType,
        experienceLevel: this.experienceLevel,
        salaryMin: this.salaryMin ?? undefined,
        salaryMax: this.salaryMax ?? undefined,
        currency: this.currency || undefined,
        closingDate: this.closingDate,
        isActive: this.isActive,
        matchThreshold: this.matchThreshold,
        externalJobUrl: this.externalJobUrl || undefined,
        applicationInstructions: this.applicationInstructions || undefined,
        preferredCertifications: this.preferredCertifications,
        activityRecencyDays: this.activityRecencyDays ?? undefined,
        skills: skillsPayload,
        benefitIds: Array.from(this.selectedBenefitIds),
      };
      this.jobAdService.update(this.editAd.id, dto).subscribe({
        next: () => { this.saving.set(false); this.saved.emit(); },
        error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to update. Please try again.'); },
      });
    } else {
      const dto: JobAdvertisementCreateRequest = {
        title: this.title,
        description: this.description,
        location: this.location,
        department: this.department || undefined,
        jobType: this.jobType,
        experienceLevel: this.experienceLevel,
        salaryMin: this.salaryMin ?? undefined,
        salaryMax: this.salaryMax ?? undefined,
        currency: this.currency || undefined,
        closingDate: this.closingDate,
        isActive: this.isActive,
        matchThreshold: this.matchThreshold,
        externalJobUrl: this.externalJobUrl || undefined,
        applicationInstructions: this.applicationInstructions || undefined,
        preferredCertifications: this.preferredCertifications,
        activityRecencyDays: this.activityRecencyDays ?? undefined,
        skills: skillsPayload,
        benefitIds: Array.from(this.selectedBenefitIds),
      };
      this.jobAdService.create(dto).subscribe({
        next: () => { this.saving.set(false); this.saved.emit(); },
        error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Failed to create. Please try again.'); },
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  labelFor(jt: JobType | ExperienceLevel | ImportanceLevel): string {
    return jt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
