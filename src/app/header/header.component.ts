import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from '../Services/AdminPanel.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  email: string;
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private adminPanelService: AdminPanelService) {
      // Subscribe to router events
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.updateAdminStatus();
        }
      });
    }

  ngOnInit(): void {
    this.updateAdminStatus();
  }

  updateAdminStatus(): void {
    this.email = this.adminPanelService.userMail; // Replace this with the actual role string from your application
    this.isAdmin = this.email === 'Admin';
  }
}
