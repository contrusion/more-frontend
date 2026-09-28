import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProfileComponent } from './profile.component';
import { AccountProfile, AuthService } from '../../services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService> & { userData$: any };

  const profileResponse: AccountProfile = {
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    jobTitle: 'Product Designer',
    bio: 'Experienced designer building hiring workflows.',
    location: 'Cape Town',
    phoneNumber: '+27 82 000 0000',
    preferredContactMethod: 'EMAIL',
    roleCategory: null,
    talentPersona: 'WARM_LEAD',
    availableInMonths: 2,
    companyWebsite: null,
    userTypes: ['APPLICANT'],
    createdAt: '2026-09-01',
    lastLogin: '2026-09-28T08:30:00',
    loginCount: 12
  };

  beforeEach(async () => {
    mockAuthService = Object.assign(
      jasmine.createSpyObj<AuthService>('AuthService', [
        'getUserRoles',
        'getUserPersona',
        'getUserAvailabilityInMonths',
        'getMyProfile',
        'updateMyProfile',
        'setUserPersona',
        'setUserAvailabilityInMonths'
      ]),
      {
        userData$: new BehaviorSubject({
          name: 'Jane Smith',
          email: 'jane@example.com'
        })
      }
    );

    mockAuthService.getUserRoles.and.returnValue(['USER']);
    mockAuthService.getUserPersona.and.returnValue('WARM_LEAD');
    mockAuthService.getUserAvailabilityInMonths.and.returnValue(2);
    mockAuthService.getMyProfile.and.returnValue(of(profileResponse));
    mockAuthService.updateMyProfile.and.returnValue(of(profileResponse));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate profile signals and form from the API response', () => {
    expect(component.userName()).toBe('Jane Smith');
    expect(component.location()).toBe('Cape Town');
    expect(component.profileForm.controls.firstName.value).toBe('Jane');
    expect(component.profileForm.controls.preferredContactMethod.value).toBe('EMAIL');
    expect(component.profileForm.controls.availableInMonths.value).toBe(2);
  });

  it('should open the edit drawer with current profile values', () => {
    component.openEditDrawer();

    expect(component.editDrawerOpen()).toBeTrue();
    expect(component.profileForm.controls.bio.value).toBe('Experienced designer building hiring workflows.');
  });

  it('should submit updated profile values through the API', () => {
    const updatedProfile: AccountProfile = {
      ...profileResponse,
      firstName: 'Janet',
      location: 'Johannesburg',
      bio: 'Updated bio',
      preferredContactMethod: 'PHONE'
    };
    mockAuthService.updateMyProfile.and.returnValue(of(updatedProfile));

    component.openEditDrawer();
    component.profileForm.patchValue({
      firstName: 'Janet',
      lastName: 'Smith',
      location: 'Johannesburg',
      phoneNumber: '+27 82 999 9999',
      preferredContactMethod: 'PHONE',
      talentPersona: 'WARM_LEAD',
      availableInMonths: 2,
      bio: 'Updated bio'
    });

    component.saveProfile();

    expect(mockAuthService.updateMyProfile).toHaveBeenCalledWith({
      firstName: 'Janet',
      lastName: 'Smith',
      bio: 'Updated bio',
      location: 'Johannesburg',
      phoneNumber: '+27 82 999 9999',
      preferredContactMethod: 'PHONE',
      talentPersona: 'WARM_LEAD',
      availableInMonths: 2,
      companyWebsite: null
    });
    expect(component.saveMessage()).toBe('Profile updated successfully.');
    expect(component.editDrawerOpen()).toBeFalse();
    expect(component.userName()).toBe('Janet Smith');
  });
});
