import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { AlertService } from '../../../alert-and-notification/infrastructure/alert-api.service';
import { RecommendationService } from '../../../agronomic-recommendation/infrastructure/recommendation-api.service';
import { SensorReadingService } from '../../../../shared/infrastructure/sensor-reading.service';
import { DeviceService } from '../../../iot-device-management/infrastructure/device-api.service';
import { InspectionService } from '../../../field-technical-management/infrastructure/inspection-api.service';
import { Plantation } from '../../../field-technical-management/domain/plantation.model';
import { Zone } from '../../../field-technical-management/domain/zone.model';
import { Alert } from '../../../alert-and-notification/domain/alert.model';
import { Recommendation } from '../../../agronomic-recommendation/domain/recommendation.model';
import { SensorReading } from '../../../../shared/domain/sensor-reading.model';
import { Device } from '../../../iot-device-management/domain/device.model';
import { FieldInspection } from '../../../field-technical-management/domain/inspection.model';

interface SparklineItem {
  label: string;
  unit: string;
  color: string;
  currentValue: number;
  vMin: number;
  vMax: number;
  points: string;
}

interface TrendCard {
  label: string;
  unit: string;
  currentValue: number;
  delta: number;
  direction: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
  alertLevel: string | null;
}

interface ZoneHealthItem {
  id: number;
  name: string;
  hectares: number;
  status: 'optimal' | 'at_risk' | 'critical';
  statusColor: string;
  statusLabel: string;
  criticalParam: string | null;
  criticalParamColor: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly plantationService = inject(PlantationService);
  private readonly alertService = inject(AlertService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly sensorReadingService = inject(SensorReadingService);
  private readonly deviceService = inject(DeviceService);
  private readonly authService = inject(AuthService);
  private readonly inspectionService = inject(InspectionService);
  private readonly router = inject(Router);

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

  readonly loading = signal(true);
  readonly error = signal('');
  readonly plantations = signal<Plantation[]>([]);
  readonly selectedPlantationId = signal(0);

  readonly zones = signal<Zone[]>([]);
  readonly activeAlerts = signal<Alert[]>([]);
  readonly alertCount = signal({ critical: 0, warning: 0, total: 0 });
  readonly recommendations = signal<Recommendation[]>([]);
  readonly latestReadings = signal<SensorReading[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly inspections = signal<FieldInspection[]>([]);
  readonly trendReadings = signal<SensorReading[]>([]);

  readonly selectedPlantation = computed(() => {
    const id = this.selectedPlantationId();
    return this.plantations().find((p) => p.id === id) ?? null;
  });

  readonly healthColors: Record<string, string> = {
    optimal: 'var(--color-success)',
    at_risk: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  readonly healthLabels: Record<string, string> = {
    optimal: 'Optimo',
    at_risk: 'En riesgo',
    critical: 'Critico',
  };

  readonly growerAlertLabels: Record<string, string> = {
    critical: 'Urgente',
    warning: 'Atencion',
  };

  readonly connectedCount = computed(() =>
    this.devices().filter((d) => d.connectivityStatus === 'connected').length,
  );
  readonly offlineCount = computed(() =>
    this.devices().filter((d) => d.connectivityStatus === 'offline_mode').length,
  );
  readonly disconnectedCount = computed(() =>
    this.devices().filter((d) => d.connectivityStatus === 'disconnected').length,
  );

  readonly sparklineItems = computed((): SparklineItem[] => {
    const readings = this.trendReadings();
    if (!readings.length) return [];

    const grouped = new Map<string, SensorReading[]>();
    for (const r of readings) {
      const key = r.variableType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }

    const configs: Record<string, { label: string; unit: string; color: string }> = {
      temperature: { label: 'Temperatura', unit: '°C', color: 'var(--color-warning)' },
      soil_humidity: { label: 'Humedad del suelo', unit: '%', color: 'var(--color-accent-cyan)' },
      soil_ph: { label: 'pH del suelo', unit: '', color: 'var(--color-success)' },
    };

    const items: SparklineItem[] = [];
    for (const [key, groupReadings] of grouped) {
      const cfg = configs[key];
      if (!cfg || groupReadings.length < 2) continue;

      const sorted = [...groupReadings].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      );
      const values = sorted.map((r) => r.value);
      const vMin = Math.min(...values);
      const vMax = Math.max(...values);
      const buffer = (vMax - vMin) * 0.15 || 0.5;
      const yMin = vMin - buffer;
      const yMax = vMax + buffer;
      const yRange = yMax - yMin;

      const width = 200;
      const height = 48;
      const pad = 3;
      const plotH = height - pad * 2;
      const points = sorted
        .map((r, i) => {
          const x = pad + (i / Math.max(sorted.length - 1, 1)) * (width - pad * 2);
          const y = pad + plotH - ((r.value - yMin) / yRange) * plotH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

      items.push({
        label: cfg.label,
        unit: cfg.unit,
        color: cfg.color,
        currentValue: sorted[sorted.length - 1].value,
        vMin,
        vMax,
        points,
      });
    }
    return items;
  });

  readonly trendCards = computed((): TrendCard[] => {
    const readings = this.trendReadings();
    if (!readings.length) return [];

    const grouped = new Map<string, SensorReading[]>();
    for (const r of readings) {
      const key = r.variableType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }

    const alerts = this.activeAlerts();
    const configs: Record<string, { label: string; unit: string; color: string; icon: string }> = {
      temperature: {
        label: 'Temperatura',
        unit: '°C',
        color: 'var(--color-warning)',
        icon: 'M12 2a7 7 0 00-7 7c0 2.4 1.2 4.6 3 5.9V22h2v-4h4v4h2v-7.1c1.8-1.3 3-3.5 3-5.9a7 7 0 00-7-7z',
      },
      soil_humidity: {
        label: 'Humedad',
        unit: '%',
        color: 'var(--color-accent-cyan)',
        icon: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z',
      },
      soil_ph: {
        label: 'pH',
        unit: '',
        color: 'var(--color-success)',
        icon: 'M9 2a1 1 0 011 1v1h4V3a1 1 0 112 0v1h1a2 2 0 012 2v2h-2v6h2v2a2 2 0 01-2 2h-1v1a1 1 0 11-2 0v-1h-4v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2h2V8H3V6a2 2 0 012-2h1V3a1 1 0 011-1z',
      },
    };

    const items: TrendCard[] = [];
    for (const [key, groupReadings] of grouped) {
      const cfg = configs[key];
      if (!cfg || groupReadings.length < 2) continue;

      const sorted = [...groupReadings].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const delta = last.value - first.value;
      const absDelta = Math.abs(delta);
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (absDelta > 0.05 && delta > 0) direction = 'up';
      else if (absDelta > 0.05 && delta < 0) direction = 'down';

      const matchedAlert = alerts.find((a) => a.variableType === key);
      const alertLevel = matchedAlert?.alertLevel ?? null;
      const cardColor = matchedAlert?.alertLevel === 'critical'
        ? 'var(--color-danger)'
        : matchedAlert?.alertLevel === 'warning'
          ? 'var(--color-warning)'
          : cfg.color;

      items.push({
        label: cfg.label,
        unit: cfg.unit,
        currentValue: last.value,
        delta: Math.abs(delta),
        direction,
        color: cardColor,
        icon: cfg.icon,
        alertLevel,
      });
    }
    return items;
  });

  readonly topRecommendation = computed(() => {
    const recs = this.recommendations();
    if (!recs.length) return null;
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...recs].sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))[0];
  });

  readonly zoneHealthItems = computed((): ZoneHealthItem[] => {
    const zoneList = this.zones();
    const alerts = this.activeAlerts();

    return zoneList.map((zone) => {
      const zoneAlerts = alerts
        .filter((a) => a.monitoringZoneId === zone.id)
        .sort((a, b) => {
          const order: Record<string, number> = { critical: 0, warning: 1, informative: 2 };
          return (order[a.alertLevel] ?? 99) - (order[b.alertLevel] ?? 99);
        });

      const worstAlert = zoneAlerts[0] ?? null;
      const criticalParam = worstAlert
        ? `${worstAlert.label}: ${worstAlert.triggeredValue} — ${this.growerAlertLabels[worstAlert.alertLevel] ?? ''}`
        : null;
      const criticalParamColor = worstAlert?.alertLevel === 'critical'
        ? 'var(--color-danger)'
        : worstAlert?.alertLevel === 'warning'
          ? 'var(--color-warning)'
          : 'var(--color-text-muted)';

      return {
        id: zone.id,
        name: zone.name,
        hectares: zone.hectares,
        status: zone.cropHealthStatus,
        statusColor: this.healthColors[zone.cropHealthStatus],
        statusLabel: this.healthLabels[zone.cropHealthStatus],
        criticalParam,
        criticalParamColor,
      };
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  selectPlantation(id: number): void {
    this.selectedPlantationId.set(id);
    if (id > 0) {
      this.loadZones(id);
    } else {
      this.zones.set([]);
    }
  }

  navigateToReports(): void {
    this.router.navigate(['/reportes']);
  }

  private loadAll(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      plantations: this.plantationService.list(),
      alerts: this.alertService.list({ status: 'active', size: 50 }),
      alertCount: this.alertService.count(),
      recommendations: this.recommendationService.list({ status: 'published', size: 3 }),
      readings: this.sensorReadingService.list({ size: 6 }),
      trendData: this.sensorReadingService.list({ size: 72 }),
      devices: this.deviceService.list(),
      inspections: this.inspectionService.list({ size: 4 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ plantations, alerts, alertCount, recommendations, readings, trendData, devices, inspections }) => {
          this.plantations.set(plantations);
          this.activeAlerts.set(alerts.alerts);
          this.alertCount.set({
            critical: alertCount.critical,
            warning: alertCount.warning,
            total: alertCount.total,
          });
          this.recommendations.set(recommendations.recommendations);
          this.latestReadings.set(readings.readings);
          this.trendReadings.set(trendData.readings);
          this.devices.set(devices);
          this.inspections.set(inspections.inspections);

          this.loadZones(plantations[0]?.id ?? 0);
        },
        error: () => this.error.set('No se pudieron cargar los datos del dashboard.'),
      });
  }

  private loadZones(plantationId: number): void {
    if (!plantationId) return;

    this.plantationService.listZones(plantationId).subscribe({
      next: (zones) => this.zones.set(zones),
    });
  }
}
