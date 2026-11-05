import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AdminApiService, AdminPlantationDto } from '../../../infrastructure/admin-api.service';
import { environment } from '../../../../../environments/environment';
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
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly log = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    plantationName: ['', Validators.required],
    hectares: [12, [Validators.required, Validators.min(0.1)]],
    address: ['Pucallpa', Validators.required],
    sectorName: ['Sector Norte', Validators.required],
    iotMac: [environment.demo.deviceMac || 'AA:BB:CC:DD:EE:01', Validators.required],
    gatewayMac: [environment.demo.gatewayMac || 'AA:BB:CC:00:00:01', Validators.required],
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

  private pushLog(line: string): void {
    this.log.update((rows) => [...rows, line]);
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
  }

  runSetup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.log.set([]);

    const ensurePlantation$ =
      v.existingPlantationId > 0
        ? of({ id: v.existingPlantationId } as AdminPlantationDto).pipe(
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
          return this.api
            .assignSector(plantationId, {
              iotDeviceMacAddress: v.iotMac.trim(),
              sectorName: v.sectorName.trim(),
            })
            .pipe(
              catchError((e) => {
                this.pushLog(
                  `${this.t.translate('admin.field.log.sectorSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                );
                return of(void 0);
              }),
              switchMap(() => {
                this.pushLog(this.t.translate('admin.field.log.sectorOk'));
                return this.api.registerEdgeGateway(v.gatewayMac.trim(), v.monitoringZoneId).pipe(
                  catchError((e) => {
                    this.pushLog(
                      `${this.t.translate('admin.field.log.gatewaySkip')} ${getApiErrorMessage(e, '')}`.trim(),
                    );
                    return of(void 0);
                  }),
                );
              }),
              switchMap(() => {
                this.pushLog(this.t.translate('admin.field.log.gatewayOk'));
                return this.api
                  .registerIotDevice(v.gatewayMac.trim(), {
                    iotMac: v.iotMac.trim(),
                    plantationId,
                  })
                  .pipe(
                    catchError((e) => {
                      this.pushLog(
                        `${this.t.translate('admin.field.log.iotSkip')} ${getApiErrorMessage(e, '')}`.trim(),
                      );
                      return of(void 0);
                    }),
                  );
              }),
              switchMap(() => {
                this.pushLog(this.t.translate('admin.field.log.iotOk'));
                return of(plantationId);
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
