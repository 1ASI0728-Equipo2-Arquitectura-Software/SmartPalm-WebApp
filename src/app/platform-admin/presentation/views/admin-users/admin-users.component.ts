import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService, AdminUserDto } from '../../../infrastructure/admin-api.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { TranslationService } from '../../../../i18n/translation.service';
import { AdminUserDeletionService } from '../../../application/admin-user-deletion.service';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly deletionWorkflow = inject(AdminUserDeletionService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly users = signal<AdminUserDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingUserId = this.deletionWorkflow.deletingUserId;
  readonly error = signal('');
  readonly success = signal('');

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Agronomist' as 'Agronomist' | 'PalmGrower', Validators.required],
  });

  private readonly refreshAfterDeletion = effect(() => {
    if (this.deletionWorkflow.lastResult()?.status === 'completed') this.reload();
  });

  ngOnInit(): void {
    this.reload();
  }

  get title(): string {
    return this.t.translate('admin.users.title');
  }
  get subtitle(): string {
    return this.t.translate('admin.users.subtitle');
  }
  get createTitle(): string {
    return this.t.translate('admin.users.createTitle');
  }
  get listTitle(): string {
    return this.t.translate('admin.users.listTitle');
  }
  get fullNameLabel(): string {
    return this.t.translate('admin.users.fullName');
  }
  get usernameLabel(): string {
    return this.t.translate('admin.users.username');
  }
  get emailLabel(): string {
    return this.t.translate('admin.users.email');
  }
  get passwordLabel(): string {
    return this.t.translate('admin.users.password');
  }
  get roleFieldLabel(): string {
    return this.t.translate('admin.users.roleLabel');
  }
  get emptyLabel(): string {
    return this.t.translate('admin.users.empty');
  }
  get submitLabel(): string {
    return this.saving()
      ? this.t.translate('admin.users.creating')
      : this.t.translate('admin.users.create');
  }
  get roleHelp(): string {
    return this.t.translate('admin.users.roleHelp');
  }
  get reloadLabel(): string {
    return this.t.translate('admin.users.reload');
  }
  get deleteLabel(): string {
    return this.t.translate('admin.users.delete');
  }
  get deletingLabel(): string {
    return this.t.translate('admin.users.deleting');
  }

  /** Two creatable product roles (Administrator is seed-only). */
  readonly roleOptions: { value: 'Agronomist' | 'PalmGrower'; labelKey: string }[] = [
    { value: 'Agronomist', labelKey: 'admin.users.role.agronomist' },
    { value: 'PalmGrower', labelKey: 'admin.users.role.grower' },
  ];

  roleOptionLabel(key: string): string {
    return this.t.translate(key);
  }

  roleLabel(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return this.t.translate('admin.users.role.admin');
    if (r.includes('grower')) return this.t.translate('admin.users.role.grower');
    return this.t.translate('admin.users.role.agronomist');
  }

  canDeleteUser(user: AdminUserDto): boolean {
    return !(user.role || '').toLowerCase().includes('admin');
  }

  deleteUser(user: AdminUserDto): void {
    if (!this.canDeleteUser(user) || this.deletingUserId() !== null) return;
    const confirmation = this.t
      .translate('admin.users.deleteConfirm')
      .replace('{{name}}', user.fullName || user.username);
    if (typeof window !== 'undefined' && !window.confirm(confirmation)) return;

    this.error.set('');
    this.deletionWorkflow.start(user);
  }

  roleChipBg(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'rgba(14,165,184,0.12)';
    if (r.includes('grower')) return 'rgba(245,158,11,0.12)';
    return 'rgba(76,205,130,0.15)';
  }

  roleChipFg(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'var(--color-accent-cyan)';
    if (r.includes('grower')) return 'var(--color-warning)';
    return 'var(--color-brand-primary)';
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .listUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.users.set(rows),
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.users.errorLoad'))),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const raw = this.form.getRawValue();
    this.api
      .createUser({
        fullName: raw.fullName.trim(),
        username: raw.username.trim(),
        email: raw.email.trim(),
        password: raw.password,
        role: raw.role,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (u) => {
          this.success.set(
            this.t.translate('admin.users.created').replace('{{name}}', u.username || raw.username),
          );
          this.form.reset({
            fullName: '',
            username: '',
            email: '',
            password: '',
            role: 'Agronomist',
          });
          this.reload();
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.users.errorCreate'))),
      });
  }
}
