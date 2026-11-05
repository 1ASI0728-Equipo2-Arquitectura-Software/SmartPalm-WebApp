import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../i18n/translation.service';
import { IotDeviceManagementStore } from '../../../application/iot-device-management.store';

@Component({
  selector: 'app-device-list',
  imports: [RouterLink],
  templateUrl: './device-list.component.html',
})
export class DeviceListComponent implements OnInit {
  private readonly store = inject(IotDeviceManagementStore);
  private readonly t = inject(TranslationService);

  readonly selectedPlantationId = signal(0);

  // Proxy store signals so the template bindings remain unchanged
  readonly devices = this.store.devices;
  readonly plantations = this.store.plantations;
  readonly loading = this.store.devicesLoading;
  readonly error = this.store.devicesError;

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

  get connectivityLabels(): Record<string, string> {
    return {
      connected: this.t.translate('device.list.connectivity.connected'),
      offline_mode: this.t.translate('device.list.connectivity.offlineMode'),
      disconnected: this.t.translate('device.list.connectivity.disconnected'),
    };
  }

  readonly healthColors: Record<string, string> = {
    healthy: 'var(--color-success)',
    warning: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  get healthLabels(): Record<string, string> {
    return {
      healthy: this.t.translate('device.list.health.healthy'),
      warning: this.t.translate('device.list.health.warning'),
      critical: this.t.translate('device.list.health.critical'),
    };
  }

  get backDashboardLabel(): string { return this.t.translate('device.list.backDashboard'); }
  get headingLabel(): string { return this.t.translate('device.list.heading'); }
  get subtitleLabel(): string { return this.t.translate('device.list.subtitle'); }
  get allPlantationsLabel(): string { return this.t.translate('device.list.allPlantations'); }
  get counterLabel(): string { return this.t.translate('device.list.counter'); }
  get registerLabel(): string { return this.t.translate('device.list.register'); }
  get loadingLabel(): string { return this.t.translate('device.list.loading'); }
  get emptyTitleLabel(): string { return this.t.translate('device.list.emptyTitle'); }
  get emptyDescriptionLabel(): string { return this.t.translate('device.list.emptyDescription'); }
  get registerFirstLabel(): string { return this.t.translate('device.list.registerFirst'); }
  get samplingLabel(): string { return this.t.translate('device.list.sampling'); }
  get modeLabel(): string { return this.t.translate('device.list.mode'); }
  get realtimeLabel(): string { return this.t.translate('device.list.transmission.realtime'); }
  get batchLabel(): string { return this.t.translate('device.list.transmission.batch'); }
  get activeLabel(): string { return this.t.translate('device.list.activation.active'); }
  get inactiveLabel(): string { return this.t.translate('device.list.activation.inactive'); }
  get viewDetailLabel(): string { return this.t.translate('device.list.viewDetail'); }
  get minutesLabel(): string { return this.t.translate('device.list.units.minutes'); }

  ngOnInit(): void {
    this.store.loadDevices();
    this.store.loadPlantations();
  }
}
