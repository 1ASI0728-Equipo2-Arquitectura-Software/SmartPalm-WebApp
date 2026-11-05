import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Bc01AccessService } from '../../../field-technical-management/infrastructure/bc01-access.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { Device } from '../../domain/device.model';
import { DeviceService } from '../../infrastructure/device-api.service';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { Zone } from '../../../field-technical-management/domain/zone.model';

@Component({
  selector: 'app-device-detail',
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './device-detail.component.html',
})
export class DeviceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly plantationService = inject(PlantationService);
  private readonly accessService = inject(Bc01AccessService);

  readonly device = signal<Device | null>(null);
  readonly availableZones = signal<Zone[]>([]);
  readonly loading = signal(false);
  readonly accessLoading = signal(false);
  readonly zonesLoading = signal(false);
  readonly actionLoading = signal('');
  readonly error = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');
  readonly editingConfig = signal(false);
  readonly editingZone = signal(false);
  readonly canWrite = signal(false);
  readonly accessMessage = signal('');

  readonly configForm = this.fb.nonNullable.group({
    samplingIntervalMinutes: [15, [Validators.required, Validators.min(5), Validators.max(120)]],
    transmissionMode: ['realtime' as 'realtime' | 'batch', [Validators.required]],
  });

  readonly zoneForm = this.fb.nonNullable.group({
    monitoringZoneId: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadWriteAccess();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.error.set('Dispositivo no valido.');
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.actionError.set('');
    this.actionSuccess.set('');

    this.deviceService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (device) => {
          this.device.set(device);
          this.configForm.patchValue({
            samplingIntervalMinutes: device.samplingIntervalMinutes,
            transmissionMode: device.transmissionMode,
          });
          this.zoneForm.patchValue({ monitoringZoneId: device.monitoringZoneId });
          this.loadZones(device.plantationId, device.monitoringZoneId);
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo cargar el dispositivo.')),
      });
  }

  toggleConfig(): void {
    if (!this.canWrite()) {
      this.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    this.editingConfig.set(!this.editingConfig());
    this.actionError.set('');
    this.actionSuccess.set('');
  }

  toggleZone(): void {
    if (!this.canWrite()) {
      this.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    this.editingZone.set(!this.editingZone());
    this.actionError.set('');
    this.actionSuccess.set('');
  }

  saveConfiguration(): void {
    if (!this.canWrite()) {
      this.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device || this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.actionLoading.set('config');
    this.actionError.set('');
    this.actionSuccess.set('');

    this.deviceService
      .updateConfiguration(device.id, this.configForm.getRawValue())
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: () => {
          this.editingConfig.set(false);
          this.actionSuccess.set('Configuracion actualizada correctamente.');
          this.load(device.id);
        },
        error: (error: unknown) => this.actionError.set(getApiErrorMessage(error, 'No se pudo actualizar la configuracion.')),
      });
  }

  saveZone(): void {
    if (!this.canWrite()) {
      this.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device || this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      return;
    }

    this.actionLoading.set('zone');
    this.actionError.set('');
    this.actionSuccess.set('');

    this.deviceService
      .reassignZone(device.id, this.zoneForm.getRawValue().monitoringZoneId)
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: () => {
          this.editingZone.set(false);
          this.actionSuccess.set('Zona reasignada correctamente.');
          this.load(device.id);
        },
        error: (error: unknown) => this.actionError.set(getApiErrorMessage(error, 'No se pudo reasignar la zona.')),
      });
  }

  deactivate(): void {
    this.runToggleAction('deactivate');
  }

  activate(): void {
    this.runToggleAction('activate');
  }

  private runToggleAction(action: 'activate' | 'deactivate'): void {
    if (!this.canWrite()) {
      this.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device) return;

    this.actionLoading.set(action);
    this.actionError.set('');
    this.actionSuccess.set('');

    if (action === 'activate') {
      this.deviceService
        .activate(device.id)
        .pipe(finalize(() => this.actionLoading.set('')))
        .subscribe({
          next: () => {
            this.actionSuccess.set('Estado del dispositivo actualizado.');
            this.load(device.id);
          },
          error: (error: unknown) => this.actionError.set(getApiErrorMessage(error, 'No se pudo actualizar el estado del dispositivo.')),
        });
      return;
    }

    this.deviceService
      .deactivate(device.id)
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: (response) => {
          this.actionSuccess.set(response.message);
          this.load(device.id);
        },
        error: (error: unknown) => this.actionError.set(getApiErrorMessage(error, 'No se pudo actualizar el estado del dispositivo.')),
      });
  }

  private loadWriteAccess(): void {
    this.accessLoading.set(true);
    this.accessService
      .loadWriteAccess()
      .pipe(finalize(() => this.accessLoading.set(false)))
      .subscribe((access) => {
        this.canWrite.set(access.canWrite);
        this.accessMessage.set(access.message);
      });
  }

  private loadZones(plantationId: number, currentZoneId: number): void {
    this.zonesLoading.set(true);

    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (zones) => {
          const availableZones = zones.filter((zone) => !zone.device || zone.id === currentZoneId);
          this.availableZones.set(availableZones);
          this.zoneForm.patchValue({ monitoringZoneId: currentZoneId });
        },
        error: (error: unknown) => this.actionError.set(getApiErrorMessage(error, 'No se pudieron cargar las zonas disponibles.')),
      });
  }
}
