import { Routes } from '@angular/router';
import { AuthGuard } from './none-functional-features/authentication-and-authorization/guards/auth.guard';
import { RoleGuard } from './none-functional-features/authentication-and-authorization/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./none-functional-features/authentication-and-authorization/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'callback',
    loadComponent: () => import('./none-functional-features/authentication-and-authorization/components/callback/call-back.component').then(m => m.CallbackComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./functional-features/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'interactions',
    loadComponent: () => import('./functional-features/interactions/interactions-layout.component').then(m => m.InteractionsLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full'
      },
      {
        path: 'events',
        loadComponent: () => import('./functional-features/interactions/interactions.component').then(m => m.InteractionsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./functional-features/interactions/analytics/interactions-analytics.component').then(m => m.InteractionsAnalyticsComponent)
      },
      {
        path: 'reconnection',
        loadComponent: () => import('./functional-features/interactions/reconnection/reconnection.component').then(m => m.ReconnectionComponent)
      },
      {
        path: 'email-sync',
        loadComponent: () => import('./functional-features/interactions/email-sync/email-sync.component').then(m => m.EmailSyncComponent)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./functional-features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MO_ADMIN'] },
    children: [
      {
        path: '',
        redirectTo: 'outreach-ml',
        pathMatch: 'full'
      },
      {
        path: 'outreach-ml',
        loadComponent: () => import('./functional-features/interactions/dataset-export/dataset-export.component').then(m => m.DatasetExportComponent)
      }
    ]
  },
  {
    path: 'personal-development',
    loadComponent: () => import('./functional-features/recruitment/recruitment-layout.component').then(m => m.RecruitmentLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['APPLICANT'] },
    children: [
      {
        path: '',
        redirectTo: 'living-cv',
        pathMatch: 'full'
      },
      {
        path: 'goals',
        loadComponent: () => import('./functional-features/recruitment/candidate/goals/candidate-goals.component').then(m => m.CandidateGoalsComponent)
      },
      {
        path: 'living-cv',
        loadComponent: () => import('./functional-features/recruitment/candidate/living-cv/living-cv.component').then(m => m.LivingCvComponent)
      },
      {
        path: 'work-experience',
        loadComponent: () => import('./functional-features/recruitment/candidate/work-experience/work-experience.component').then(m => m.WorkExperienceComponent)
      },
      {
        path: 'education',
        loadComponent: () => import('./functional-features/recruitment/candidate/education/education.component').then(m => m.EducationComponent)
      },
      {
        path: 'certifications',
        loadComponent: () => import('./functional-features/recruitment/candidate/certifications/certifications.component').then(m => m.CertificationsComponent)
      },
      {
        path: 'references',
        loadComponent: () => import('./functional-features/recruitment/candidate/references/references.component').then(m => m.ReferencesComponent)
      },
      {
        path: 'skills',
        loadComponent: () => import('./functional-features/recruitment/candidate/skills/skills.component').then(m => m.SkillsComponent)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./none-functional-features/authentication-and-authorization/components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];