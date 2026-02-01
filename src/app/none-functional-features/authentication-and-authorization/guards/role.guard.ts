// filepath: c:\Users\malul\Projects\Contrusion\More\more-frontend\src\app\none-functional-features\authentication-and-authorization\role.guard.ts
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredRoles = route.data['roles'] as Array<string>;

    return this.authService.isAuthenticated$.pipe(
      map(({ isAuthenticated }) => {
        if (!isAuthenticated) {
          return this.router.parseUrl('/login');
        }

        // If no specific roles are required, just being authenticated is enough
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        // Check if the user has at least one of the required roles
        const hasRequiredRole = requiredRoles.some(role => 
          this.authService.hasRole(role)
        );

        if (hasRequiredRole) {
          return true;
        }

        // Redirect to unauthorized page if user doesn't have required roles
        return this.router.parseUrl('/unauthorized');
      })
    );
  }
}