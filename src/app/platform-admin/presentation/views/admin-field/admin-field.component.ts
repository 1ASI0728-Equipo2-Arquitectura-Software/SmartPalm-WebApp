import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import {
  AdminApiService,
  AdminPlantationDto,
  AdminUserDto,
} from '../../../infrastructure/admin-api.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-admin-field',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-field.component.html',
})
export class AdminFieldComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly plantations = signal<AdminPlantationDto[]>([]);
  readonly growers = signal<AdminUserDto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly log = signal<string[]>([]);
  /** Raw one-time credentials are kept only in component memory for physical setup. */
  readonly gatewayCloudKey = signal('');
  readonly iotBootstrapKey = signal('');

  form = this.fb.nonNullable.group({
    plantationName: ['', Validators.required],
    hectares: [12, [Validators.required, Validators.min(0.1)]],
    address: ['Pucallpa', Validators.required],
    ownerUserId: [0],
    sectorName: ['Sector Norte', Validators.required],
    iotMac: ['', Validators.required],
    gatewayMac: ['', Validators.required],
    monitoringZoneId: [1, [Validators.required, Validators.min(1)]],
    existingPlantationId: [0],
  });

  ngOnInit(): void {
    this.reloadPlantations();
  }

  get title(): string {
    return this.t.translate('admin.field.title');
  }
  get subtitle(): string {
    return this.t.translate('admin.field.subtitle');
  }
  get plantationBlock(): string {
    return this.t.translate('admin.field.plantationBlock');
  }
  get devicesBlock(): string {
    return this.t.translate('admin.field.devicesBlock');
  }
  get existingLabel(): string {
    return this.t.translate('admin.field.existing');
  }
  get createNewLabel(): string {
    return this.t.translate('admin.field.createNew');
  }
  get nameLabel(): string {
    return this.t.translate('admin.field.name');
  }
  get hectaresLabel(): string {
    return this.t.translate('admin.field.hectares');
  }
  get addressLabel(): string {
    return this.t.translate('admin.field.address');
  }
  get ownerLabel(): string {
    return this.t.translate('admin.field.owner');
  }
  get sectorNameLabel(): string {
    return this.t.translate('admin.field.sectorName');
  }
  get iotMacLabel(): string {
    return this.t.translate('admin.field.iotMac');
  }
  get gatewayMacLabel(): string {
    return this.t.translate('admin.field.gatewayMac');
  }
  get zoneIdLabel(): string {
    return this.t.translate('admin.field.zoneId');
  }
  get logTitle(): string {
    return this.t.translate('admin.field.logTitle');
  }
  get submitLabel(): string {
    return this.saving()
      ? this.t.translate('admin.field.running')
      : this.t.translate('admin.field.run');
  }
  get fieldHint(): string {
    return this.t.translate('admin.field.hint');
  }

  tr(key: string): string {
    return this.t.translate(key);
  }

  private pushLog(line: string): void {
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

  reloadPlantations(): void {
    this.loading.set(true);
    this.api
      .listPlantations()
      .pipe(
        catchError(() => of([] as AdminPlantationDto[])),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((rows) => {
        this.plantations.set(rows);
        if (rows[0] && !this.form.controls.existingPlantationId.value) {
          this.form.patchValue({ existingPlantationId: rows[0].id });
        }
      });

    this.api
      .listGrowers()
      .pipe(catchError(() => of([] as AdminUserDto[])))
      .subscribe((rows) => {
        this.growers.set(rows);
        if (rows[0] && !this.form.controls.ownerUserId.value) {
          this.form.patchValue({ ownerUserId: rows[0].id });
        }
      });
  }

  runSetup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.existingPlantationId <= 0 && !v.ownerUserId) {
      this.error.set(this.t.translate('admin.field.ownerRequired'));
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.log.set([]);
    this.gatewayCloudKey.set('');
    this.iotBootstrapKey.set('');

    const ensurePlantation$ =
      v.existingPlantationId > 0
        ? of(
            this.plantations().find((p) => p.id === v.existingPlantationId) ||
              ({ id: v.existingPlantationId } as AdminPlantationDto),
          ).pipe(
            switchMap((p) => {
              this.pushLog(
                this.t
                  .translate('admin.field.log.reusePlantation')
                  .replace('{{id}}', String(p.id)),
              );
              return of(p);
            }),
          )
        : this.api
            .createPlantation({
              name: v.plantationName.trim(),
              hectares: v.hectares,
              address: v.address.trim(),
              palmGrowerId: Number(v.ownerUserId),
            })
            .pipe(
              switchMap((p) => {
                this.pushLog(
                  this.t
                    .translate('admin.field.log.createdPlantation')
                    .replace('{{id}}', String(p.id)),
                );
                return of(p);
              }),
            );

    ensurePlantation$
      .pipe(
        switchMap((plantation) => {
          const plantationId = plantation.id;
          const ownerUserId = plantation.palmGrowerId || plantation.ownerId || Number(v.ownerUserId);
          if (!ownerUserId) {
            throw new Error(this.t.translate('admin.field.ownerRequired'));
          }
          return this.api.getSubscriptionForUser(ownerUserId).pipe(
            switchMap((subscription) => {
              if (subscription.status.toLowerCase() !== 'active') {
                throw new Error(
                  this.t.translate('admin.field.subscriptionInactive'),
                );
              }
              return this.api
                .assignSector(plantationId, {
                  // The sector exists independently; the IoT is linked in DeviceService.
                  iotDeviceMacAddress: null,
                  sectorName: v.sectorName.trim(),
                })
                .pipe(
              catchError((e) => {
                this.pushLog(
                  `${this.t.translate('admin.field.log.sectorSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                );
                throw e;
              }),
              switchMap((sector) => {
                if (!sector.id) {
                  throw new Error('The sector registration did not return a sector id.');
                }
                this.pushLog(this.t.translate('admin.field.log.sectorOk'));
                return this.api
                  .registerEdgeGateway(v.gatewayMac.trim(), ownerUserId, v.monitoringZoneId)
                  .pipe(
                  catchError((e) => {
                    this.pushLog(
                      `${this.t.translate('admin.field.log.gatewaySkip')} ${getApiErrorMessage(e, '')}`.trim(),
                    );
                    throw e;
                  }),
                    map((gateway) => {
                      this.gatewayCloudKey.set(gateway.cloudKey);
                      this.pushLog(this.t.translate('admin.field.log.gatewayOk'));
                      return { plantationId, ownerUserId, sectorId: sector.id };
                    }),
                  );
              }),
              switchMap((context) => {
                return this.api
                  .registerIotDevice(v.gatewayMac.trim(), {
                    iotMac: v.iotMac.trim(),
                    ownerUserId: context.ownerUserId,
                    plantationId: context.plantationId,
                    sectorId: context.sectorId,
                  })
                  .pipe(
                    catchError((e) => {
                      this.pushLog(
                        `${this.t.translate('admin.field.log.iotSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      throw e;
                    }),
                    map((iot) => {
                      this.iotBootstrapKey.set(iot.bootstrapKey);
                      this.pushLog(this.t.translate('admin.field.log.iotOk'));
                      return context.plantationId;
                    }),
                  );
                  }),
                );
            }),
          );
        }),
        finalize(() => {
          this.saving.set(false);
          this.reloadPlantations();
        }),
      )
      .subscribe({
        next: (plantationId) => {
          this.success.set(
            this.t
              .translate('admin.field.done')
              .replace('{{id}}', String(plantationId))
              .replace('{{mac}}', v.iotMac.trim()),
          );
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('admin.field.error'))),
      });
  }
}
