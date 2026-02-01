import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  private authSubscription?: Subscription;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated and redirect to home
    this.authSubscription = this.authService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      console.log('Login component - isAuthenticated:', isAuthenticated);
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to home');
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  login(): void {
    console.log('Login button clicked');
    this.isLoading = true;
    // Trigger Keycloak login
    this.authService.login();
    // Note: The redirect to Keycloak happens immediately, so isLoading won't be visible for long
  }
}