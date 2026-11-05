import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { LocaleService } from '../../../../i18n/locale.service';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly localeService = inject(LocaleService);
  private readonly t = inject(TranslationService);

  /** Hidden route /auth/login/admin — no public link. */
  isAdminLogin = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required]],
  });

  loading = false;
  /** Signal so async login errors always refresh the view. */
  readonly error = signal('');

  ngOnInit(): void {
    this.isAdminLogin = this.resolveAdminMode();
  }

  get toggleLabel(): string {
    return this.localeService.locale() === 'es' ? 'English' : 'Español';
  }

  get submitLabel(): string {
    if (this.loading) return this.t.translate('login.loading');
    return this.isAdminLogin
      ? this.t.translate('login.adminSubmit')
      : this.t.translate('login.submitButton');
  }

  get heroBadge(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHeroBadge')
      : this.t.translate('login.heroBadge');
  }
  get heroEyebrow(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHeroEyebrow')
      : this.t.translate('login.heroEyebrow');
  }
  get heroTitle(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHeroTitle')
      : this.t.translate('login.heroTitle');
  }
  get heroDescription(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHeroDescription')
      : this.t.translate('login.heroDescription');
  }
  get featureAlerts(): string {
    return this.t.translate('login.featureAlerts');
  }
  get featureRecommendations(): string {
    return this.t.translate('login.featureRecommendations');
  }
  get featureReports(): string {
    return this.t.translate('login.featureReports');
  }
  get cardAlertsTitle(): string {
    return this.t.translate('login.cardAlertsTitle');
  }
  get cardAlertsDesc(): string {
    return this.t.translate('login.cardAlertsDesc');
  }
  get cardInspectionsTitle(): string {
    return this.t.translate('login.cardInspectionsTitle');
  }
  get cardInspectionsDesc(): string {
    return this.t.translate('login.cardInspectionsDesc');
  }
  get cardReportsTitle(): string {
    return this.t.translate('login.cardReportsTitle');
  }
  get cardReportsDesc(): string {
    return this.t.translate('login.cardReportsDesc');
  }
  get formEyebrow(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminFormEyebrow')
      : this.t.translate('login.formEyebrow');
  }
  get heroHeadline(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHeroHeadline')
      : this.t.translate('login.heroHeadline');
  }
  get formSubtitle(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminFormSubtitle')
      : this.t.translate('login.formSubtitle');
  }

  get usernameLabel(): string {
    return this.t.translate('login.usernameLabel');
  }
  get usernamePlaceholder(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminUsernamePlaceholder')
      : this.t.translate('login.usernamePlaceholder');
  }
  get passwordLabel(): string {
    return this.t.translate('login.passwordLabel');
  }
  get passwordPlaceholder(): string {
    return this.t.translate('login.passwordPlaceholder');
  }

  get forgotPassword(): string {
    return this.t.translate('login.forgotPassword');
  }
  get noPublicRegisterHint(): string {
    return this.isAdminLogin
      ? this.t.translate('login.adminHint')
      : this.t.translate('login.noPublicRegisterHint');
  }

  hasError(controlName: 'username' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: 'username' | 'password'): string {
    const control = this.form.controls[controlName];

    if (control.errors?.['required']) {
      return controlName === 'username'
        ? this.t.translate('login.usernameRequired')
        : this.t.translate('login.passwordRequired');
    }

    if (control.errors?.['minlength']) {
      return this.t.translate('login.usernameMin');
    }

    return '';
  }

  private resolveAdminMode(): boolean {
    const dataFlag = this.route.snapshot.data['adminLogin'] === true;
    const url = this.router.url.split('?')[0];
    return dataFlag || /\/auth\/login\/admin\/?$/.test(url);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Re-resolve on submit so route mode is never stale.
    this.isAdminLogin = this.resolveAdminMode();
    this.loading = true;
    this.error.set('');
    const raw = this.form.getRawValue();
    this.authService
      .login({ username: raw.username.trim(), password: raw.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const role = res.user.role;
          if (this.isAdminLogin) {
            if (role !== 'administrator') {
              this.authService.logout();
              this.error.set(this.t.translate('login.adminOnlyError'));
              return;
            }
            this.router.navigate(['/admin']);
            return;
          }
          if (role === 'administrator') {
            this.router.navigate(['/admin']);
            return;
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.error.set(
            getApiErrorMessage(error, this.t.translate('login.invalidCredentials')),
          );
        },
      });
  }

  switchLanguage(): void {
    this.localeService.toggle();
  }
}
