import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { LocaleService } from '../../../../i18n/locale.service';
import { TranslationService } from '../../../../i18n/translation.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-recover-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.component.html',
})
export class RecoverPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);
  readonly localeService = inject(LocaleService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  sent = false;

  get toggleLabel(): string {
    return this.localeService.locale() === 'es' ? 'English' : 'Español';
  }

  get titleLabel(): string { return this.t.translate('recover.title'); }
  get subtitleLabel(): string { return this.t.translate('recover.subtitle'); }
  get emailLabel(): string { return this.t.translate('recover.emailLabel'); }
  get emailPlaceholder(): string { return this.t.translate('recover.emailPlaceholder'); }
  get submitLabel(): string {
    return this.loading
      ? this.t.translate('recover.submitting')
      : this.t.translate('recover.submit');
  }
  get successLabel(): string { return this.t.translate('recover.success'); }
  get backLoginLabel(): string { return this.t.translate('recover.backLogin'); }

  switchLanguage(): void {
    this.localeService.toggle();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService
      .recoverPassword(this.form.controls.email.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: () => (this.sent = true) });
  }
}
