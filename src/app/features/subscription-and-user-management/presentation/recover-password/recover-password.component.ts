import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-recover-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.component.html',
})
export class RecoverPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  sent = false;

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService
      .recoverPassword(this.form.controls.email.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: () => (this.sent = true) });
  }
}
