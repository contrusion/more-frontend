import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <p>Processing authentication...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `]
})
export class CallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Navigate to the home page or the originally requested page
        this.router.navigate(['/home']);
      } else {
        // If authentication failed, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}