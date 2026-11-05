import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet, AppSidebarComponent, NavbarComponent],
  templateUrl: './auth-shell.component.html',
})
export class AuthShellComponent {}
