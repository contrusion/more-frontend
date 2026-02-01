import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated$.pipe(
      map(({ isAuthenticated }) => {
        if (isAuthenticated) {
          return true;
        }
        return this.router.parseUrl('/login');
        //return true; // Temporarily allow access for testing purposes
      })
    );
  }
}