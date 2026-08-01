import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './none-functional-features/authentication-and-authorization/services/auth.service';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { NavDrawerComponent } from './shared/components/nav-drawer/nav-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TopbarComponent, NavDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'more-frontend';
  isAuthenticated = false;
  userName: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
    });

    this.authService.userData$.subscribe(userData => {
      this.userName = userData?.name || null;
    });
  }

  logout() {
    this.authService.logout();
  }
}