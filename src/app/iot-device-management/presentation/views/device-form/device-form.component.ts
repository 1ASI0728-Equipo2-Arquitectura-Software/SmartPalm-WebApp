import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { IotDeviceManagementStore } from '../../../application/iot-device-management.store';
import { Zone } from '../../../../field-technical-management/domain/model/zone.entity';

interface ZoneOption {
  zone: Zone;
  occupied: boolean;
}

@Component({
  selector: 'app-device-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './device-form.component.html',
})
export class DeviceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(IotDeviceManagementStore);

  // Proxy store signals for template
  readonly loading = this.store.plantationsLoading;
  readonly accessLoading = this.store.accessLoading;
  readonly zonesLoading = this.store.zonesLoading;
  readonly saving = this.store.formSaving;
  readonly error = this.store.formError;
  readonly plantations = this.store.plantations;
  readonly zones = this.store.zones;
  readonly canWrite = this.store.canWrite;
  readonly accessMessage = this.store.accessMessage;

  readonly selectedPlantationId = computed(() => this.form.controls.plantationId.value);

  readonly zoneOptions = computed<ZoneOption[]>(() =>
    this.zones().map((zone) => ({
      zone,
      occupied: !!zone.device && zone.device !== null,
    })),
  );

  readonly freeZonesCount = computed(() => this.zoneOptions().filter((z) => !z.occupied).length);

  readonly form = this.fb.nonNullable.group({
    serialNumber: ['', [Validators.required, Validators.pattern(/^SP-IOT-[A-Z0-9]{4}-[A-Z0-9]{5}$/)]],
    plantationId: [0, [Validators.required, Validators.min(1)]],
    monitoringZoneId: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    // Redirect agronomists back to dashboard
    const isAgronomist = this.store.isAgronomist;
    if (isAgronomist()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.store.loadPlantations();
    this.store.loadWriteAccess();
    this.form.controls.plantationId.valueChanges.pipe(startWith(this.form.controls.plantationId.value)).subscribe((plantationId) => {
      if (plantationId > 0) {
        this.store.loadZones(plantationId);
      } else {
        this.store.zones.set([]);
        this.form.controls.monitoringZoneId.setValue(0);
      }
    });
  }

  save(): void {
    if (!this.canWrite()) {
      this.store.formError.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.createDevice(this.form.getRawValue()).subscribe({
      next: (device) => this.router.navigate(['/dispositivos', device.id]),
    });
  }
}
