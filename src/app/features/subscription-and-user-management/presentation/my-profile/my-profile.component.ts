import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../infrastructure/user-api.service';
import { User } from '../../../../shared/domain/user.model';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './my-profile.component.html',
})
export class MyProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  user = signal<User | null>(null);
  editing = false;
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+51\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
    region: ['', [Validators.required]],
    city: ['', [Validators.required]],
  });

  regions = ['Ucayali', 'San Mart\u00edn', 'Loreto'];

  constructor() {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.error.set('');
    this.userService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (u) => this.user.set(u),
        error: () => this.error.set('Error al cargar el perfil.'),
      });
  }

  startEdit(): void {
    const u = this.user();
    if (!u) return;
    this.form.patchValue({
      fullName: u.fullName,
      phone: u.phone,
      region: u.region,
      city: u.city,
    });
    this.editing = true;
    this.error.set('');
  }

  cancelEdit(): void {
    this.editing = false;
    this.error.set('');
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.userService
      .updateProfile(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (u) => {
          this.user.set(u);
          this.editing = false;
        },
        error: () => this.error.set('Error al guardar los cambios.'),
      });
  }
}
