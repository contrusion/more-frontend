import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  
  adminSections = [
    {
      title: 'Outreach ML Dataset Export',
      description: 'Export recruitment emails for machine learning model training',
      icon: '📊',
      route: '/admin/outreach-ml'
    }
    // Future admin features can be added here
    // {
    //   title: 'User Management',
    //   description: 'Manage user accounts and permissions',
    //   icon: '👥',
    //   route: '/admin/users'
    // },
    // {
    //   title: 'System Settings',
    //   description: 'Configure application settings',
    //   icon: '⚙️',
    //   route: '/admin/settings'
    // }
  ];
}
