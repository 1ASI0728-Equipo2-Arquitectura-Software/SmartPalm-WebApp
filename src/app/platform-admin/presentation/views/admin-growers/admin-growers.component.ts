import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
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
  /** Raw one-time credentials are kept only in component memory for physical setup. */
  readonly gatewayCloudKey = signal('');
  readonly iotBootstrapKey = signal('');

  /** Mode: onboard new grower or operate on existing */
  form = this.fb.nonNullable.group({
    mode: ['existing' as 'existing' | 'create'],
    growerUserId: [''],
    // create grower
    fullName: [''],
    username: [''],
    email: [''],
    password: [''],
    // access
    planType: ['Seed'],
    amount: [149],
    // plantation
    plantationName: [''],
    hectares: [12, [Validators.required, Validators.min(0.1)]],
    address: ['Pucallpa'],
    // iot
    sectorName: ['Sector Norte'],
    iotMac: [''],
    gatewayMac: [''],
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

  copyKey(value: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
    }
  }

  acknowledgeCredentials(): void {
    this.gatewayCloudKey.set('');
    this.iotBootstrapKey.set('');
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
   * 3) create plantation owned by grower using the administrator contract
   * 4) sector + gateway + IoT as admin
   * 5) optional agronomist affiliation
   */
  runProvision(): void {
    const v = this.form.getRawValue();
    if (v.mode === 'create') {
      if (!v.username.trim() || !v.email.trim() || v.password.length < 6) {
        this.error.set(this.t.translate('admin.growers.errorForm'));
        return;
      }
    } else if (!v.growerUserId) {
      this.error.set(this.t.translate('admin.growers.errorGrower'));
      return;
    }
    if (!v.plantationName.trim() || !v.sectorName.trim() || !v.iotMac.trim() || !v.gatewayMac.trim()) {
      this.error.set(this.t.translate('admin.growers.errorForm'));
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    this.log.set([]);
    this.gatewayCloudKey.set('');
    this.iotBootstrapKey.set('');

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
                });
              }),
            )
        : of({
            id: Number(v.growerUserId),
            username:
              this.growers().find((g) => g.id === Number(v.growerUserId))?.username || '',
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
          return this.ensureActiveSubscription(grower.id, v.planType, Number(v.amount)).pipe(
            switchMap(() => {
              this.push(this.t.translate('admin.growers.log.accessOk'));
              return this.api.createPlantation({
                  name: v.plantationName.trim(),
                  hectares: Number(v.hectares),
                  address: v.address.trim(),
                  palmGrowerId: grower.id,
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
              // The sector is created before the IoT registration. Device ownership
              // is established by the DeviceService request below.
              iotDeviceMacAddress: null,
              sectorName: v.sectorName.trim(),
            })
            .pipe(
              catchError((e) => {
                this.push(
                  `${this.t.translate('admin.growers.log.sectorSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                );
                throw e;
              }),
              switchMap((sector) => {
                if (!sector.id) {
                  throw new Error('The sector registration did not return a sector id.');
                }
                this.push(this.t.translate('admin.growers.log.sectorOk'));
                return this.api
                  .registerEdgeGateway(
                    v.gatewayMac.trim(),
                    grower.id,
                    Number(v.monitoringZoneId),
                  )
                  .pipe(
                    catchError((e) => {
                      this.push(
                        `${this.t.translate('admin.growers.log.gatewaySkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      throw e;
                    }),
                    map((gateway) => {
                      this.gatewayCloudKey.set(gateway.cloudKey);
                      this.push(this.t.translate('admin.growers.log.gatewayOk'));
                      return { grower, plantationId, sectorId: sector.id };
                    }),
                  );
              }),
              switchMap((context) => {
                return this.api
                  .registerIotDevice(v.gatewayMac.trim(), {
                    iotMac: v.iotMac.trim(),
                    ownerUserId: context.grower.id,
                    plantationId: context.plantationId,
                    sectorId: context.sectorId,
                  })
                  .pipe(
                    catchError((e) => {
                      this.push(
                        `${this.t.translate('admin.growers.log.iotSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      throw e;
                    }),
                    map((iot) => {
                      this.iotBootstrapKey.set(iot.bootstrapKey);
                      this.push(this.t.translate('admin.growers.log.iotOk'));
                      return context;
                    }),
                  );
              }),
              switchMap((context) => {
                if (!v.linkAgronomist || !v.agronomistId) {
                  return of(context);
                }
                const agroId = Number(v.agronomistId);
                return this.api.createAffiliation(agroId, context.plantationId).pipe(
                  catchError((e) => {
                    this.push(
                      `${this.t.translate('admin.growers.log.affSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                    );
                    return of(void 0);
                  }),
                  switchMap(() => {
                    this.push(this.t.translate('admin.growers.log.affOk'));
                    return of(context);
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

  private ensureActiveSubscription(
    userId: number,
    planType: string,
    amount: number,
  ) {
    return this.api.getSubscriptionForUser(userId).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
          return throwError(() => error);
        }
        return this.api.createSubscription(userId, planType).pipe(
          tap(() => this.push(this.t.translate('admin.growers.log.subscriptionCreated'))),
          switchMap(() => this.api.processPayment(userId, amount)),
          switchMap(() => this.api.getSubscriptionForUser(userId)),
        );
      }),
      switchMap((subscription) => {
        if (subscription.status.toLowerCase() === 'active') {
          return of(subscription);
        }
        if (subscription.status.toLowerCase() !== 'pending') {
          return throwError(
            () => new Error(`Subscription is not payable: ${subscription.status}`),
          );
        }
        return this.api.processPayment(userId, amount).pipe(
          tap(() => this.push(this.t.translate('admin.growers.log.paymentOk'))),
          switchMap(() => this.api.getSubscriptionForUser(userId)),
        );
      }),
      switchMap((subscription) =>
        subscription.status.toLowerCase() === 'active'
          ? of(subscription)
          : throwError(() => new Error(`Subscription is not active: ${subscription.status}`)),
      ),
    );
  }
}
