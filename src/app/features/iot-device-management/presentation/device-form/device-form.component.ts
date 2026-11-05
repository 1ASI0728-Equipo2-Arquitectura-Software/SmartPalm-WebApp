import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { Bc01AccessService } from '../../../field-technical-management/infrastructure/bc01-access.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { DeviceService } from '../../infrastructure/device-api.service';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { Plantation } from '../../../field-technical-management/domain/plantation.model';
import { Zone } from '../../../field-technical-management/domain/zone.model';

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
  private readonly deviceService = inject(DeviceService);
  private readonly plantationService = inject(PlantationService);
  private readonly accessService = inject(Bc01AccessService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly accessLoading = signal(false);
  readonly saving = signal(false);
  readonly zonesLoading = signal(false);
  readonly error = signal('');
  readonly plantations = signal<Plantation[]>([]);
  readonly zones = signal<Zone[]>([]);
  readonly canWrite = signal(false);
  readonly accessMessage = signal('');

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

  ngOnInit(): void {
    if (this.authService.currentUser?.role === 'agronomist') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadPlantations();
    this.loadWriteAccess();
    this.form.controls.plantationId.valueChanges.pipe(startWith(this.form.controls.plantationId.value)).subscribe((plantationId) => {
      if (plantationId > 0) {
        this.loadZones(plantationId);
      } else {
        this.zones.set([]);
        this.form.controls.monitoringZoneId.setValue(0);
      }
    });
  }

  save(): void {
    if (!this.canWrite()) {
      this.error.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.deviceService
      .create(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (device) => this.router.navigate(['/dispositivos', device.id]),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo registrar el dispositivo.')),
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

  private loadPlantations(): void {
    this.loading.set(true);
    this.error.set('');

    this.plantationService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (plantations) => this.plantations.set(plantations),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudieron cargar las plantaciones.')),
      });
  }

  private loadZones(plantationId: number): void {
    this.zonesLoading.set(true);
    this.error.set('');

    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          const currentZoneId = this.form.controls.monitoringZoneId.value;
          const freeZones = zones.filter((zone) => !zone.device);
          if (!freeZones.some((zone) => zone.id === currentZoneId)) {
            this.form.controls.monitoringZoneId.setValue(freeZones.length > 0 ? freeZones[0].id : 0);
          }
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudieron cargar las zonas.')),
      });
  }
}
