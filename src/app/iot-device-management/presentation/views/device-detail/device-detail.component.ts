import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IotDeviceManagementStore } from '../../../application/iot-device-management.store';

@Component({
  selector: 'app-device-detail',
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './device-detail.component.html',
})
export class DeviceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(IotDeviceManagementStore);

  // Local UI-only state
  readonly editingConfig = signal(false);
  readonly editingZone = signal(false);

  // Proxy store signals for template
  readonly device = this.store.device;
  readonly loading = this.store.deviceLoading;
  readonly accessLoading = this.store.accessLoading;
  readonly zonesLoading = this.store.zonesLoading;
  readonly actionLoading = this.store.actionLoading;
  readonly error = this.store.deviceError;
  readonly actionError = this.store.actionError;
  readonly actionSuccess = this.store.actionSuccess;
  readonly canWrite = this.store.canWrite;
  readonly accessMessage = this.store.accessMessage;
  readonly zones = this.store.zones;

  // Available zones for reassignment (free zones + current zone)
  readonly availableZones = computed(() => {
    const currentZoneId = this.device()?.monitoringZoneId;
    return this.zones().filter((zone) => !zone.device || zone.id === currentZoneId);
  });

  readonly configForm = this.fb.nonNullable.group({
    samplingIntervalMinutes: [15, [Validators.required, Validators.min(5), Validators.max(120)]],
    transmissionMode: ['realtime' as 'realtime' | 'batch', [Validators.required]],
  });

  readonly zoneForm = this.fb.nonNullable.group({
    monitoringZoneId: [0, [Validators.required, Validators.min(1)]],
  });

  private currentDeviceId = signal(0);

  constructor() {
    // React when the store's device signal changes to patch forms and load zones
    effect(() => {
      const device = this.store.device();
      if (device && device.id === this.currentDeviceId()) {
        this.configForm.patchValue({
          samplingIntervalMinutes: device.samplingIntervalMinutes,
          transmissionMode: device.transmissionMode,
        }, { emitEvent: false });
        this.zoneForm.patchValue({ monitoringZoneId: device.monitoringZoneId }, { emitEvent: false });
        this.store.loadZones(device.plantationId);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadWriteAccess();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.currentDeviceId.set(id);
      this.store.loadDevice(id);
    } else {
      this.store.deviceError.set('Dispositivo no valido.');
    }
  }

  toggleConfig(): void {
    if (!this.canWrite()) {
      this.store.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }
    this.editingConfig.set(!this.editingConfig());
    this.store.actionError.set('');
    this.store.actionSuccess.set('');
  }

  toggleZone(): void {
    if (!this.canWrite()) {
      this.store.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }
    this.editingZone.set(!this.editingZone());
    this.store.actionError.set('');
    this.store.actionSuccess.set('');
  }

  saveConfiguration(): void {
    if (!this.canWrite()) {
      this.store.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device || this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.store.updateConfiguration(device.id, this.configForm.getRawValue()).subscribe({
      next: () => {
        this.editingConfig.set(false);
        this.store.actionSuccess.set('Configuracion actualizada correctamente.');
        this.store.loadDevice(device.id);
      },
    });
  }

  saveZone(): void {
    if (!this.canWrite()) {
      this.store.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device || this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      return;
    }

    this.store.reassignZone(device.id, this.zoneForm.getRawValue().monitoringZoneId).subscribe({
      next: () => {
        this.editingZone.set(false);
        this.store.actionSuccess.set('Zona reasignada correctamente.');
        this.store.loadDevice(device.id);
      },
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
      this.store.actionError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    const device = this.device();
    if (!device) return;

    if (action === 'activate') {
      this.store.activate(device.id).subscribe({
        next: () => {
          this.store.actionSuccess.set('Estado del dispositivo actualizado.');
          this.store.loadDevice(device.id);
        },
      });
      return;
    }

    this.store.deactivate(device.id).subscribe({
      next: (response) => {
        this.store.actionSuccess.set(response.message);
        this.store.loadDevice(device.id);
      },
    });
  }
}
