import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { TranslationService } from '../../../../i18n/translation.service';
import { LocaleService } from '../../../../i18n/locale.service';

function passwordStrength(control: AbstractControl<string>) {
  const value = control.value;
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  if (!hasUpper || !hasNumber) {
    return { passwordStrength: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);
  readonly localeService = inject(LocaleService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrength]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    role: ['agronomist' as 'palm_grower' | 'agronomist', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\+51\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
    region: ['', [Validators.required]],
    city: ['', [Validators.required]],
  });

  loading = false;
  error = '';

  regions = ['Ucayali', 'San Martin', 'Loreto'];

  get backLoginLabel(): string { return this.t.translate('register.backLogin'); }
  get headingLabel(): string { return this.t.translate('register.heading'); }
  get subtitleLabel(): string { return this.t.translate('register.subtitle'); }
  get fullNameLabel(): string { return this.t.translate('register.fullName'); }
  get fullNamePlaceholder(): string { return this.t.translate('register.fullNamePlaceholder'); }
  get emailLabel(): string { return this.t.translate('register.email'); }
  get emailPlaceholder(): string { return this.t.translate('register.emailPlaceholder'); }
  get passwordLabel(): string { return this.t.translate('register.password'); }
  get passwordHint(): string { return this.t.translate('register.passwordHint'); }
  get passwordPlaceholder(): string { return this.t.translate('register.passwordPlaceholder'); }
  get roleLabel(): string { return this.t.translate('register.role'); }
  get roleAgronomistLabel(): string { return this.t.translate('register.roleAgronomist'); }
  get roleGrowerLabel(): string { return this.t.translate('register.roleGrower'); }
  get phoneLabel(): string { return this.t.translate('register.phone'); }
  get phoneHint(): string { return this.t.translate('register.phoneHint'); }
  get phonePlaceholder(): string { return this.t.translate('register.phonePlaceholder'); }
  get regionLabel(): string { return this.t.translate('register.region'); }
  get regionPlaceholder(): string { return this.t.translate('register.regionPlaceholder'); }
  get cityLabel(): string { return this.t.translate('register.city'); }
  get cityPlaceholder(): string { return this.t.translate('register.cityPlaceholder'); }
  get submitLabel(): string {
    return this.loading ? this.t.translate('register.submitting') : this.t.translate('register.submit');
  }
  get hasAccountLabel(): string { return this.t.translate('register.hasAccount'); }
  get loginLinkLabel(): string { return this.t.translate('register.loginLink'); }

  get toggleLabel(): string {
    return this.localeService.locale() === 'es' ? 'English' : 'Español';
  }

  switchLanguage(): void {
    this.localeService.toggle();
  }

  hasError(controlName: 'email' | 'password' | 'fullName' | 'phone' | 'region' | 'city'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: 'email' | 'password' | 'fullName' | 'phone' | 'region' | 'city'): string {
    const control = this.form.controls[controlName];
    if (control.errors?.['required']) {
      const map: Record<string, string> = {
        fullName: this.t.translate('register.errors.fullNameRequired'),
        email: this.t.translate('register.errors.emailRequired'),
        password: this.t.translate('register.errors.passwordRequired'),
        phone: this.t.translate('register.errors.phoneRequired'),
        region: this.t.translate('register.errors.regionRequired'),
        city: this.t.translate('register.errors.cityRequired'),
      };
      return map[controlName];
    }
    if (control.errors?.['email']) return this.t.translate('register.errors.emailInvalid');
    if (control.errors?.['minlength']) {
      if (controlName === 'password') return this.t.translate('register.errors.passwordMin');
      if (controlName === 'fullName') return this.t.translate('register.errors.fullNameMin');
    }
    if (control.errors?.['passwordStrength']) return this.t.translate('register.errors.passwordStrength');
    if (control.errors?.['pattern'] && controlName === 'phone') {
      return this.t.translate('register.errors.phonePattern');
    }
    return '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = this.t.translate('register.errors.reviewFields');
      return;
    }

    this.loading = true;
    this.error = '';
    this.authService
      .register(this.form.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error) => {
          this.error = getApiErrorMessage(error, this.t.translate('register.errors.registerFailed'));
        },
      });
  }
}
