import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../shared/infrastructure/auth.service';
import { TranslationService } from '../../../i18n/translation.service';
import { LocaleService } from '../../../i18n/locale.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styles: [
    `
      a.admin-nav-active {
        background: rgba(255, 255, 255, 0.14) !important;
        color: #ffffff !important;
        border-left-color: #4ccd82 !important;
      }
    `,
  ],
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);
  readonly localeService = inject(LocaleService);

  readonly user = this.auth.user;

  /** Recompute labels when translations reload after locale toggle. */
  readonly nav = computed(() => {
    // Depend on locale so labels refresh with i18n dictionary.
    this.localeService.locale();
    this.t.translations();
    return [
      { id: 'home', label: this.t.translate('admin.nav.home'), route: '/admin', exact: true },
      { id: 'users', label: this.t.translate('admin.nav.users'), route: '/admin/users', exact: false },
      {
        id: 'growers',
        label: this.t.translate('admin.nav.growers'),
        route: '/admin/growers',
        exact: false,
      },
      {
        id: 'access',
        label: this.t.translate('admin.nav.access'),
        route: '/admin/access',
        exact: false,
      },
      { id: 'field', label: this.t.translate('admin.nav.field'), route: '/admin/field', exact: false },
    ];
  });

  get brand(): string {
    return this.t.translate('admin.shell.brand');
  }
  get brandSub(): string {
    return this.t.translate('admin.shell.brandSub');
  }
  get logoutLabel(): string {
    return this.t.translate('admin.shell.logout');
  }
  get roleLabel(): string {
    return this.t.translate('admin.shell.role');
  }
  get languageLabel(): string {
    return this.t.translate('admin.shell.language');
  }
  get toggleLabel(): string {
    return this.localeService.locale() === 'es' ? 'English' : 'Español';
  }

  switchLanguage(): void {
    this.localeService.toggle();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login/admin']);
  }
}
