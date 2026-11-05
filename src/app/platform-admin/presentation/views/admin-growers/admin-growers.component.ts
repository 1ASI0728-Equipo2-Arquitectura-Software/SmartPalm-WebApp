import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import {
  AdminApiService,
  AdminPlantationDto,
  AdminUserDto,
} from '../../../infrastructure/admin-api.service';
import { SubscriptionService } from '../../../../subscription-and-user-management/infrastructure/subscription-api.service';
import { SubscriptionPlan } from '../../../../subscription-and-user-management/domain/model/subscription-plan.entity';
import { environment } from '../../../../../environments/environment';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { TranslationService } from '../../../../i18n/translation.service';

/**
 * Admin hub to provision PalmGrower assets for the mobile grower app:
 * account → active plan → plantation (owned by grower) → IoT → optional agronomist link.
 */
@Component({
  selector: 'app-admin-growers',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-growers.component.html',
})
export class AdminGrowersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly plansApi = inject(SubscriptionService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly growers = signal<AdminUserDto[]>([]);
  readonly agronomists = signal<AdminUserDto[]>([]);
  readonly plantations = signal<AdminPlantationDto[]>([]);
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly log = signal<string[]>([]);

  /** Mode: onboard new grower or operate on existing */
  form = this.fb.nonNullable.group({
    mode: ['existing' as 'existing' | 'create'],
    growerUserId: [''],
    // create grower
    fullName: [''],
    username: [''],
    email: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    // access
    planType: ['Seed'],
    amount: [149],
    // plantation
    plantationName: [''],
    hectares: [12, [Validators.required, Validators.min(0.1)]],
    address: ['Pucallpa'],
    // iot
    sectorName: ['Sector Norte'],
    iotMac: [environment.demo.deviceMac || 'AA:BB:CC:DD:EE:02'],
    gatewayMac: [environment.demo.gatewayMac || 'AA:BB:CC:00:00:02'],
    monitoringZoneId: [1],
    // affiliation
    agronomistId: [''],
    linkAgronomist: [true],
  });

  ngOnInit(): void {
    this.reload();
  }

  get title(): string {
    return this.t.translate('admin.growers.title');
  }
  get subtitle(): string {
    return this.t.translate('admin.growers.subtitle');
  }
  get runLabel(): string {
    return this.busy()
      ? this.t.translate('admin.growers.running')
      : this.t.translate('admin.growers.run');
  }

  /** Template helper for i18n keys. */
  tr(key: string): string {
    return this.t.translate(key);
  }

  private push(line: string): void {
    this.log.update((rows) => [...rows, line]);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .listUsers()
      .pipe(
        catchError(() => of([] as AdminUserDto[])),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((users) => {
        const growers = users.filter((u) => (u.role || '').toLowerCase().includes('grower'));
        const agronomists = users.filter((u) =>
          (u.role || '').toLowerCase().includes('agronom'),
        );
        this.growers.set(growers);
        this.agronomists.set(agronomists);
        if (growers[0] && !this.form.controls.growerUserId.value) {
          this.form.patchValue({ growerUserId: String(growers[0].id) });
        }
        if (agronomists[0] && !this.form.controls.agronomistId.value) {
          this.form.patchValue({ agronomistId: String(agronomists[0].id) });
        }
      });

    this.plansApi
      .getPlans()
      .pipe(catchError(() => of([] as SubscriptionPlan[])))
      .subscribe((plans) => {
        this.plans.set(
          plans.length
            ? plans
            : [
                {
                  id: 'Seed',
                  name: 'Seed',
                  priceMonthly: 149,
                  priceCurrency: 'USD',
                  billingCycle: 'monthly',
                  features: [],
                  isActive: true,
                },
              ],
        );
        if (plans[0]) {
          this.form.patchValue({
            planType: plans[0].id,
            amount: plans[0].priceMonthly || 149,
          });
        }
      });

    this.api
      .listPlantations()
      .pipe(catchError(() => of([] as AdminPlantationDto[])))
      .subscribe((rows) => this.plantations.set(rows));
  }

  onPlanChange(): void {
    const type = this.form.controls.planType.value;
    const plan = this.plans().find((p) => p.id === type || p.name === type);
    if (plan?.priceMonthly != null) {
      this.form.patchValue({ amount: plan.priceMonthly });
    }
  }

  /**
   * Full provisioning for mobile grower app:
   * 1) ensure grower user
   * 2) activate plan
   * 3) create plantation owned by grower (temporary grower JWT, admin session intact)
   * 4) sector + gateway + IoT as admin
   * 5) optional agronomist affiliation
   */
  runProvision(): void {
    const v = this.form.getRawValue();
    if (v.mode === 'create') {
      if (!v.username.trim() || !v.email.trim() || !v.password) {
        this.error.set(this.t.translate('admin.growers.errorForm'));
        return;
      }
    } else if (!v.growerUserId || !v.password) {
      this.error.set(this.t.translate('admin.growers.errorPassword'));
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    this.log.set([]);

    const ensureGrower$ =
      v.mode === 'create'
        ? this.api
            .createUser({
              fullName: v.fullName.trim() || v.username.trim(),
              username: v.username.trim(),
              email: v.email.trim(),
              password: v.password,
              role: 'PalmGrower',
            })
            .pipe(
              switchMap((u) => {
                this.push(
                  this.t
                    .translate('admin.growers.log.createdGrower')
                    .replace('{{name}}', u.username),
                );
                return of({
                  id: u.id,
                  username: u.username,
                  password: v.password,
                });
              }),
            )
        : of({
            id: Number(v.growerUserId),
            username:
              this.growers().find((g) => g.id === Number(v.growerUserId))?.username || '',
            password: v.password,
          }).pipe(
            switchMap((g) => {
              this.push(
                this.t
                  .translate('admin.growers.log.useGrower')
                  .replace('{{name}}', g.username || String(g.id)),
              );
              return of(g);
            }),
          );

    ensureGrower$
      .pipe(
        switchMap((grower) => {
          if (!grower.username) {
            throw new Error(this.t.translate('admin.growers.errorGrower'));
          }
          // Activate plan (admin token)
          return this.api.activateAccess(grower.id, v.planType, Number(v.amount)).pipe(
            catchError((e) => {
              // Sub may already exist — try payment only
              this.push(
                `${this.t.translate('admin.growers.log.accessRetry')} ${getApiErrorMessage(e, '')}`.trim(),
              );
              return this.api.processPayment(grower.id, Number(v.amount)).pipe(
                catchError((e2) => {
                  this.push(
                    `${this.t.translate('admin.growers.log.accessSkip')} ${getApiErrorMessage(e2, '')}`.trim(),
                  );
                  return of(void 0);
                }),
              );
            }),
            switchMap(() => {
              this.push(this.t.translate('admin.growers.log.accessOk'));
              // Plantation owned by grower
              return this.api
                .createPlantationForGrower(grower.username, grower.password, {
                  name: v.plantationName.trim(),
                  hectares: Number(v.hectares),
                  address: v.address.trim(),
                })
                .pipe(
                  switchMap((plantation) => {
                    this.push(
                      this.t
                        .translate('admin.growers.log.plantationOk')
                        .replace('{{id}}', String(plantation.id)),
                    );
                    return of({ grower, plantationId: plantation.id });
                  }),
                );
            }),
          );
        }),
        switchMap(({ grower, plantationId }) => {
          return this.api
            .assignSector(plantationId, {
              iotDeviceMacAddress: v.iotMac.trim(),
              sectorName: v.sectorName.trim(),
            })
            .pipe(
              catchError((e) => {
                this.push(
                  `${this.t.translate('admin.growers.log.sectorSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                );
                return of(void 0);
              }),
              switchMap(() => {
                this.push(this.t.translate('admin.growers.log.sectorOk'));
                return this.api
                  .registerEdgeGateway(v.gatewayMac.trim(), Number(v.monitoringZoneId))
                  .pipe(
                    catchError((e) => {
                      this.push(
                        `${this.t.translate('admin.growers.log.gatewaySkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      return of(void 0);
                    }),
                  );
              }),
              switchMap(() => {
                this.push(this.t.translate('admin.growers.log.gatewayOk'));
                return this.api
                  .registerIotDevice(v.gatewayMac.trim(), {
                    iotMac: v.iotMac.trim(),
                    plantationId,
                  })
                  .pipe(
                    catchError((e) => {
                      this.push(
                        `${this.t.translate('admin.growers.log.iotSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      return of(void 0);
                    }),
                  );
              }),
              switchMap(() => {
                this.push(this.t.translate('admin.growers.log.iotOk'));
                if (!v.linkAgronomist || !v.agronomistId) {
                  return of({ grower, plantationId });
                }
                const agroId = Number(v.agronomistId);
                return this.api.createAffiliation(agroId, plantationId).pipe(
                  catchError((e) => {
                    this.push(
                      `${this.t.translate('admin.growers.log.affSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                    );
                    return of(void 0);
                  }),
                  switchMap(() => {
                    this.push(this.t.translate('admin.growers.log.affOk'));
                    return of({ grower, plantationId });
                  }),
                );
              }),
            );
        }),
        finalize(() => {
          this.busy.set(false);
          this.reload();
        }),
      )
      .subscribe({
        next: (ctx) => {
          this.success.set(
            this.t
              .translate('admin.growers.done')
              .replace('{{name}}', ctx.grower.username)
              .replace('{{id}}', String(ctx.plantationId)),
          );
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.growers.error'))),
      });
  }
}
