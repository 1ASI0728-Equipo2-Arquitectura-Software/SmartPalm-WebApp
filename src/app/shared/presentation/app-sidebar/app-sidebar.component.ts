import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../shared/infrastructure/auth.service';
import { User } from '../../../shared/domain/user.model';
import { TranslationService } from '../../../i18n/translation.service';

type SidebarItem = {
  id: string;
  label: string;
  route: string;
  exact?: boolean;
};

/**
 * Agronomist operations desk navigation.
 * Aligns with documented path: monitoring, recommendations, interventions, plan, profile.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);

  readonly _primaryItems = computed<SidebarItem[]>(() => [
    { id: 'dashboard', label: this.t.translate('sidebar.dashboard'), route: '/dashboard', exact: true },
    { id: 'monitoring', label: this.t.translate('sidebar.monitoring'), route: '/monitoreo', exact: false },
    {
      id: 'recommendations',
      label: this.t.translate('sidebar.recommendations'),
      route: '/recomendaciones',
      exact: false,
    },
    {
      id: 'interventions',
      label: this.t.translate('sidebar.interventions'),
      route: '/intervenciones',
      exact: false,
    },
  ]);

  readonly _accountItems = computed<SidebarItem[]>(() => [
    {
      id: 'subscription',
      label: this.t.translate('sidebar.mySubscription'),
      route: '/subscription/me',
      exact: false,
    },
    { id: 'profile', label: this.t.translate('sidebar.myProfile'), route: '/profile', exact: true },
  ]);

  readonly _logoutLabel = computed(() => this.t.translate('sidebar.logout'));
  readonly _operationsCenterLabel = computed(() => this.t.translate('sidebar.operationsCenter'));

  readonly _roleLabel = computed(() => {
    if (!this.currentUser) return '';
    if (this.currentUser.role === 'administrator') {
      return this.t.translate('sidebar.role.admin');
    }
    const key =
      this.currentUser.role === 'agronomist' ? 'sidebar.role.agronomist' : 'sidebar.role.grower';
    return this.t.translate(key);
  });

  get primaryItems(): SidebarItem[] {
    return this._primaryItems();
  }
  get accountItems(): SidebarItem[] {
    return this._accountItems();
  }
  get logoutLabel(): string {
    return this._logoutLabel();
  }
  get roleLabel(): string {
    return this._roleLabel();
  }
  get operationsCenterLabel(): string {
    return this._operationsCenterLabel();
  }

  get currentUser(): User | null {
    return this.authService.currentUser;
  }

  get isAgronomist(): boolean {
    return this.currentUser?.role === 'agronomist';
  }

  get userRoleImage(): string {
    return this.isAgronomist
      ? '/images/segment/agronomist.png'
      : '/images/segment/palm_grower.png';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
