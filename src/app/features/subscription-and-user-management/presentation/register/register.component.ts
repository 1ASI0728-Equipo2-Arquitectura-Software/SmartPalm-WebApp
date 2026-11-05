import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../shared/infrastructure/auth.service';

function passwordStrength(control: AbstractControl<string>) {
  const value = control.value;
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  if (!hasUpper || !hasNumber) {
    return { passwordStrength: 'La contrasena debe contener al menos una mayuscula y un numero.' };
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

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrength]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    role: ['palm_grower' as const, [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\+51\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
    region: ['', [Validators.required]],
    city: ['', [Validators.required]],
  });

  loading = false;
  error = '';

  regions = ['Ucayali', 'San Martin', 'Loreto'];

  hasError(controlName: 'email' | 'password' | 'fullName' | 'phone' | 'region' | 'city'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getErrorMessage(controlName: 'email' | 'password' | 'fullName' | 'phone' | 'region' | 'city'): string {
    const control = this.form.controls[controlName];

    if (control.errors?.['required']) {
      const messages = {
        fullName: 'Ingresa tu nombre completo.',
        email: 'Ingresa tu correo electronico.',
        password: 'Ingresa una contrasena.',
        phone: 'Ingresa tu numero de telefono.',
        region: 'Selecciona una region.',
        city: 'Ingresa tu ciudad.',
      };

      return messages[controlName];
    }

    if (control.errors?.['email']) {
      return 'Ingresa un correo valido.';
    }

    if (control.errors?.['minlength']) {
      if (controlName === 'password') return 'La contrasena debe tener al menos 8 caracteres.';
      if (controlName === 'fullName') return 'El nombre debe tener al menos 3 caracteres.';
    }

    if (control.errors?.['passwordStrength']) {
      return control.errors['passwordStrength'];
    }

    if (control.errors?.['pattern'] && controlName === 'phone') {
      return 'Usa el formato +51 961 234 567.';
    }

    return '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Revisa los campos marcados para continuar.';
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
          this.error = getApiErrorMessage(error, 'Error al registrar. Intenta de nuevo.');
        },
      });
  }
}
