import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../shared/infrastructure/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error = '';

  hasError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (control.errors?.['required']) {
      return controlName === 'email' ? 'Ingresa tu correo electronico.' : 'Ingresa tu contrasena.';
    }

    if (control.errors?.['email']) {
      return 'Ingresa un correo valido.';
    }

    return '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error) => {
          this.error = getApiErrorMessage(error, 'Credenciales incorrectas. Intenta de nuevo.');
        },
      });
  }
}
