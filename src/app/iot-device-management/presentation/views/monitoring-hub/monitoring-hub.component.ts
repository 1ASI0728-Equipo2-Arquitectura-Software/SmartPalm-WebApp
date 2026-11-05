import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { SensorReadingService } from '../../../../shared/infrastructure/sensor-reading.service';
import { SensorReading } from '../../../../shared/domain/sensor-reading.model';
import {
  AgronomicThreshold,
  ConnectivityStatus,
  EdgeGatewayService,
  SENSOR_TYPES,
  SectorHealthDto,
  UpdateThresholdRequest,
} from '../../../infrastructure/edge-gateway-api.service';
import { IotDeviceContextService } from '../../../infrastructure/iot-device-context.service';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-monitoring-hub',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './monitoring-hub.component.html',
})
export class MonitoringHubComponent implements OnInit {
  private readonly edge = inject(EdgeGatewayService);
  private readonly sensors = inject(SensorReadingService);
  private readonly iotContext = inject(IotDeviceContextService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  /** Active MAC context (resolved from API; falls back to environment.demo). */
  readonly deviceMac = signal(environment.demo.deviceMac);
  readonly gatewayMac = signal(environment.demo.gatewayMac);
  readonly sectorId = environment.demo.sectorId ?? 1;
  readonly sensorTypes = SENSOR_TYPES;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly gateways = signal<ConnectivityStatus[]>([]);
  readonly gatewayDevices = signal<string[]>([]);
  readonly thresholds = signal<AgronomicThreshold[]>([]);
  readonly thresholdsForbidden = signal(false);
  readonly readings = signal<SensorReading[]>([]);
  readonly sectorHealth = signal<SectorHealthDto | null>(null);
  readonly savingThreshold = signal(false);
  readonly thresholdMsg = signal('');
  readonly thresholdMsgOk = signal(false);

  readonly exceededCount = computed(() => {
    const h = this.sectorHealth();
    return h?.sensorDetails?.filter((d) => d.isExceeded).length ?? 0;
  });

  readonly connectedGateways = computed(
    () => this.gateways().filter((g) => g.isConnected).length,
  );

  readonly thresholdForm = this.fb.nonNullable.group({
    type: ['Temperature' as string, Validators.required],
    min: [15, [Validators.required]],
    max: [35, [Validators.required]],
    description: [''],
  });

  get title(): string {
    return this.t.translate('monitor.heading');
  }
  get subtitle(): string {
    return this.t.translate('monitor.subtitle');
  }
  get gatewaysLabel(): string {
    return this.t.translate('monitor.gateways');
  }
  get devicesLabel(): string {
    return this.t.translate('monitor.devices');
  }
  get thresholdsLabel(): string {
    return this.t.translate('monitor.thresholds');
  }
  get readingsLabel(): string {
    return this.t.translate('monitor.readings');
  }
  get loadingLabel(): string {
    return this.t.translate('monitor.loading');
  }
  get saveLabel(): string {
    return this.t.translate('monitor.saveThreshold');
  }
  get savingLabel(): string {
    return this.t.translate('monitor.saving');
  }
  get emptyGateways(): string {
    return this.t.translate('monitor.emptyGateways');
  }
  get emptyDevices(): string {
    return this.t.translate('monitor.emptyDevices');
  }
  get emptyThresholds(): string {
    return this.thresholdsForbidden()
      ? this.t.translate('monitor.thresholdsForbidden')
      : this.t.translate('monitor.emptyThresholds');
  }
  get emptyReadings(): string {
    return this.t.translate('monitor.emptyReadings');
  }
  get emptyHealth(): string {
    return this.t.translate('monitor.emptyHealth');
  }
  get contextLabel(): string {
    return this.t
      .translate('monitor.contextLine')
      .replace('{{gateway}}', this.gatewayMac())
      .replace('{{device}}', this.deviceMac())
      .replace('{{sector}}', String(this.sectorId));
  }
  get healthLabel(): string {
    return this.t.translate('monitor.sectorHealth');
  }
  get typeLabel(): string {
    return this.t.translate('monitor.form.type');
  }
  get minLabel(): string {
    return this.t.translate('monitor.form.min');
  }
  get maxLabel(): string {
    return this.t.translate('monitor.form.max');
  }
  get descLabel(): string {
    return this.t.translate('monitor.form.description');
  }
  get refreshLabel(): string {
    return this.t.translate('monitor.refresh');
  }
  get backDashboardLabel(): string {
    return this.t.translate('monitor.backDashboard');
  }
  get editThresholdHint(): string {
    return this.t.translate('monitor.editThresholdHint');
  }
  get colType(): string {
    return this.t.translate('monitor.table.type');
  }
  get colValue(): string {
    return this.t.translate('monitor.table.value');
  }
  get colDevice(): string {
    return this.t.translate('monitor.table.device');
  }
  get colWhen(): string {
    return this.t.translate('monitor.table.when');
  }
  get exceededLabel(): string {
    return this.t.translate('monitor.exceeded');
  }
  get inRangeLabel(): string {
    return this.t.translate('monitor.inRange');
  }
  get connectedLabel(): string {
    return this.t.translate('monitor.connectivity.connected');
  }
  get disconnectedLabel(): string {
    return this.t.translate('monitor.connectivity.disconnected');
  }

  healthStatusLabel(status: number | null | undefined): string {
    if (status === 0) return this.t.translate('monitor.health.healthy');
    if (status === 1) return this.t.translate('monitor.health.warning');
    if (status === 2) return this.t.translate('monitor.health.critical');
    return this.t.translate('monitor.health.unknown');
  }

  healthStatusColor(status: number | null | undefined): string {
    if (status === 0) return 'var(--color-success)';
    if (status === 1) return 'var(--color-warning)';
    if (status === 2) return 'var(--color-danger)';
    return 'var(--color-text-muted)';
  }

  sensorTypeLabel(type: string): string {
    const key = `monitor.sensorType.${type}`;
    const translated = this.t.translate(key);
    return translated === key ? type : translated;
  }

  connectivityLabel(g: ConnectivityStatus): string {
    return g.isConnected ? this.connectedLabel : this.disconnectedLabel;
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.thresholdMsg.set('');
    this.thresholdsForbidden.set(false);

    this.iotContext
      .resolve({ refresh: true })
      .pipe(
        switchMap((ctx) => {
          this.deviceMac.set(ctx.deviceMac);
          this.gatewayMac.set(ctx.gatewayMac);
          const deviceMac = ctx.deviceMac;
          const gatewayMac = ctx.gatewayMac;

          return forkJoin({
            gateways: this.edge
              .listGateways()
              .pipe(catchError(() => of([] as ConnectivityStatus[]))),
            devices: this.edge.getDevices(gatewayMac).pipe(
              catchError(() => of({ gatewayMac, devices: [] as { deviceMac: string }[] })),
            ),
            thresholds: this.edge.listThresholds(deviceMac).pipe(
              catchError((err: unknown) => {
                if (err instanceof HttpErrorResponse && err.status === 403) {
                  this.thresholdsForbidden.set(true);
                }
                return of([] as AgronomicThreshold[]);
              }),
            ),
            readings: this.sensors
              .list({ deviceMac, size: 30 })
              .pipe(catchError(() => of({ readings: [] as SensorReading[] }))),
            sectorHealth: this.edge
              .getSectorHealth(this.sectorId)
              .pipe(catchError(() => of(null))),
          });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ gateways, devices, thresholds, readings, sectorHealth }) => {
          this.gateways.set(gateways ?? []);
          const macs = (devices?.devices ?? []).map((d) => d.deviceMac);
          this.gatewayDevices.set(macs);
          // If devices list has entries, keep active device aligned when possible
          if (macs.length && !macs.includes(this.deviceMac())) {
            this.deviceMac.set(macs[0]);
          }
          this.thresholds.set(thresholds ?? []);
          this.readings.set(readings.readings ?? []);
          this.sectorHealth.set(sectorHealth);
          const temp = (thresholds ?? []).find((th) => th.type === 'Temperature');
          if (temp) this.selectThreshold(temp);
        },
        error: (e) =>
          this.error.set(getApiErrorMessage(e, this.t.translate('monitor.error.load'))),
      });
  }

  selectThreshold(th: AgronomicThreshold): void {
    this.thresholdForm.patchValue({
      type: th.type,
      min: th.min,
      max: th.max,
      description: th.description ?? '',
    });
    this.thresholdMsg.set('');
    this.thresholdMsgOk.set(false);
  }

  saveThreshold(): void {
    if (this.thresholdsForbidden()) {
      this.thresholdMsgOk.set(false);
      this.thresholdMsg.set(this.t.translate('monitor.thresholdsForbidden'));
      return;
    }
    if (this.thresholdForm.invalid) {
      this.thresholdForm.markAllAsTouched();
      return;
    }
    const raw = this.thresholdForm.getRawValue();
    const min = Number(raw.min);
    const max = Number(raw.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      this.thresholdMsgOk.set(false);
      this.thresholdMsg.set(this.t.translate('monitor.error.invalidRange'));
      return;
    }

    const body: UpdateThresholdRequest = {
      type: raw.type,
      min,
      max,
      description: raw.description?.trim() || undefined,
    };
    this.savingThreshold.set(true);
    this.thresholdMsg.set('');
    this.thresholdMsgOk.set(false);
    const deviceMac = this.deviceMac();
    this.edge
      .updateThreshold(body, deviceMac)
      .pipe(finalize(() => this.savingThreshold.set(false)))
      .subscribe({
        next: () => {
          this.thresholdMsgOk.set(true);
          this.thresholdMsg.set(this.t.translate('monitor.thresholdSaved'));
          this.edge.listThresholds(deviceMac).subscribe({
            next: (th) => this.thresholds.set(th ?? []),
            error: (err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 403) {
                this.thresholdsForbidden.set(true);
              }
            },
          });
          this.edge.getSectorHealth(this.sectorId).subscribe({
            next: (h) => this.sectorHealth.set(h),
            error: () => undefined,
          });
        },
        error: (e) => {
          this.thresholdMsgOk.set(false);
          if (e instanceof HttpErrorResponse && e.status === 403) {
            this.thresholdsForbidden.set(true);
            this.thresholdMsg.set(this.t.translate('monitor.thresholdsForbidden'));
            return;
          }
          this.thresholdMsg.set(getApiErrorMessage(e, this.t.translate('monitor.error.save')));
        },
      });
  }
}
