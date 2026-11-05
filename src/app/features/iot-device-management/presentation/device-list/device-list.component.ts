import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Device } from '../../domain/device.model';
import { DeviceService } from '../../infrastructure/device-api.service';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { Plantation } from '../../../field-technical-management/domain/plantation.model';

@Component({
  selector: 'app-device-list',
  imports: [RouterLink],
  templateUrl: './device-list.component.html',
})
export class DeviceListComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly plantationService = inject(PlantationService);

  readonly devices = signal<Device[]>([]);
  readonly plantations = signal<Plantation[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly selectedPlantationId = signal(0);

  readonly filteredDevices = computed(() => {
    const plantationId = this.selectedPlantationId();
    const allDevices = this.devices();
    if (plantationId <= 0) return allDevices;
    return allDevices.filter((d) => d.plantationId === plantationId);
  });

  readonly connectivityColors: Record<string, string> = {
    connected: 'var(--color-success)',
    offline_mode: 'var(--color-warning)',
    disconnected: 'var(--color-danger)',
  };

  readonly connectivityLabels: Record<string, string> = {
    connected: 'Conectado',
    offline_mode: 'Modo offline',
    disconnected: 'Desconectado',
  };

  readonly healthColors: Record<string, string> = {
    healthy: 'var(--color-success)',
    warning: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  readonly healthLabels: Record<string, string> = {
    healthy: 'Saludable',
    warning: 'Atencion',
    critical: 'Critico',
  };

  ngOnInit(): void {
    this.loadDevices();
    this.loadPlantations();
  }

  private loadDevices(): void {
    this.loading.set(true);
    this.error.set('');

    this.deviceService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (devices) => this.devices.set(devices),
        error: () => this.error.set('No se pudieron cargar los dispositivos.'),
      });
  }

  private loadPlantations(): void {
    this.plantationService
      .list()
      .subscribe({
        next: (plantations) => this.plantations.set(plantations),
      });
  }
}
