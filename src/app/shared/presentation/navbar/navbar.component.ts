import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/infrastructure/auth.service';
import { User } from '../../../shared/domain/user.model';
import { LocaleService } from '../../../i18n/locale.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-navbar',
  imports: [NotificationDropdownComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly localeService = inject(LocaleService);

  get currentUser(): User | null {
    return this.authService.currentUser;
  }

  get toggleLabel(): string {
    return this.localeService.locale() === 'es' ? 'English' : 'Español';
  }

  switchLanguage(): void {
    this.localeService.toggle();
  }

  toggleMenu(): void {}

  closeMenu(): void {}

  @HostListener('window:resize')
  onResize(): void {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
