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
        path: 'messages',
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
    path: 'register',
    loadComponent: () => import('./none-functional-features/authentication-and-authorization/components/register/register.component').then(m => m.RegisterComponent)
  },
  /* Uncomment these routes when components are ready
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  */
  {
    path: '**',
    redirectTo: 'home'
  }
];