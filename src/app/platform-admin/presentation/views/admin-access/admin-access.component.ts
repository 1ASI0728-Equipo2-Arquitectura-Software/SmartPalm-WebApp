import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AdminApiService, AdminUserDto } from '../../../infrastructure/admin-api.service';
import { SubscriptionService } from '../../../../subscription-and-user-management/infrastructure/subscription-api.service';
import { SubscriptionPlan } from '../../../../subscription-and-user-management/domain/model/subscription-plan.entity';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-admin-access',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-access.component.html',
})
export class AdminAccessComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly plansApi = inject(SubscriptionService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly users = signal<AdminUserDto[]>([]);
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  form = this.fb.nonNullable.group({
    /** string values keep <select> simple; coerce on submit */
    userId: ['', [Validators.required]],
    planType: ['Seed', Validators.required],
    amount: [149, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.reload();
  }

  get title(): string {
    return this.t.translate('admin.access.title');
  }
  get subtitle(): string {
    return this.t.translate('admin.access.subtitle');
  }
  get userLabel(): string {
    return this.t.translate('admin.access.user');
  }
  get planLabel(): string {
    return this.t.translate('admin.access.plan');
  }
  get amountLabel(): string {
    return this.t.translate('admin.access.amount');
  }
  get submitLabel(): string {
    return this.saving()
      ? this.t.translate('admin.access.activating')
      : this.t.translate('admin.access.activate');
  }
  get help(): string {
    return this.t.translate('admin.access.help');
  }
  get plansTitle(): string {
    return this.t.translate('admin.access.plansTitle');
  }
  get plansHint(): string {
    return this.t.translate('admin.access.plansHint');
  }
  get userPlaceholder(): string {
    return this.t.translate('admin.access.userPlaceholder');
  }

  roleLabel(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return this.t.translate('admin.users.role.admin');
    if (r.includes('grower')) return this.t.translate('admin.users.role.grower');
    return this.t.translate('admin.users.role.agronomist');
  }

  /** Human-readable option label (never raw ids). */
  formatUserOption(u: AdminUserDto): string {
    const name = (u.fullName || '').trim();
    const username = (u.username || '').trim();
    const role = this.roleLabel(u.role);
    if (name && username && name.toLowerCase() !== username.toLowerCase()) {
      return `${name} · ${username} · ${role}`;
    }
    if (name) return `${name} · ${role}`;
    if (username) return `${username} · ${role}`;
    return role;
  }

  displayUserName(u: AdminUserDto | undefined, fallbackId?: number): string {
    if (!u) return fallbackId ? String(fallbackId) : '';
    return (u.fullName || u.username || '').trim() || String(fallbackId ?? '');
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      users: this.api.listUsers().pipe(catchError(() => of([] as AdminUserDto[]))),
      plans: this.plansApi.getPlans().pipe(catchError(() => of([] as SubscriptionPlan[]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, plans }) => {
          const operable = users.filter((u) => {
            const r = (u.role || '').toLowerCase();
            return !r.includes('admin');
          });
          this.users.set(operable);
          this.plans.set(
            plans.length
              ? plans
              : [
                  {
                    id: 'Seed',
                    name: 'Seed',
                    priceMonthly: 149,
                    priceCurrency: 'USD',
                    billingCycle: 'Monthly',
                    maxHectares: 50,
                    maxDevices: 10,
                    features: [],
                    isActive: true,
                    segment: 'agronomist',
                  },
                ],
          );
          if (operable.length) {
            const current = Number(this.form.controls.userId.value);
            const stillValid = operable.some((u) => u.id === current);
            if (!stillValid) {
              this.form.patchValue({ userId: String(operable[0].id) });
            }
          }
          const catalog = this.plans();
          if (catalog[0]) {
            this.form.patchValue({
              planType: catalog[0].id || 'Seed',
              amount: catalog[0].priceMonthly || 149,
            });
          }
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.access.errorLoad'))),
      });
  }

  onPlanChange(): void {
    const type = this.form.controls.planType.value;
    const plan = this.plans().find((p) => p.id === type || p.name === type);
    if (plan?.priceMonthly) {
      this.form.patchValue({ amount: plan.priceMonthly });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const userId = Number(raw.userId);
    const planType = raw.planType;
    const amount = Number(raw.amount);
    if (!Number.isFinite(userId) || userId <= 0) {
      this.error.set(this.t.translate('admin.access.errorActivate'));
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    // Create subscription then process payment (activates access).
    this.api
      .createSubscription(userId, planType)
      .pipe(
        switchMap(() => this.api.processPayment(userId, amount)),
        catchError((err) => {
          // If subscription already exists, still try payment.
          const msg = String(err?.error?.message || err?.message || '');
          if (err?.status === 400 || /exist|already|pending/i.test(msg)) {
            return this.api.processPayment(userId, amount);
          }
          throw err;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          const u = this.users().find((x) => x.id === userId);
          this.success.set(
            this.t
              .translate('admin.access.activated')
              .replace('{{name}}', this.displayUserName(u, userId)),
          );
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.access.errorActivate'))),
      });
  }
}
