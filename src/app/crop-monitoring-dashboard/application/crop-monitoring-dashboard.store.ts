import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { RecommendationService } from '../../agronomic-recommendation/infrastructure/agronomic-recommendation-api';
import { SensorReadingService } from '../../shared/infrastructure/sensor-reading.service';
import {
  EdgeGatewayService,
  SectorHealthDto,
} from '../../iot-device-management/infrastructure/edge-gateway-api.service';
import { IotDeviceContextService } from '../../iot-device-management/infrastructure/iot-device-context.service';
import {
  AgronomicInterventionDto,
  InterventionApiService,
} from '../../field-technical-management/infrastructure/intervention-api.service';
import { Recommendation } from '../../agronomic-recommendation/domain/model/recommendation.entity';
import { SensorReading } from '../../shared/domain/sensor-reading.model';
import { TranslationService } from '../../i18n/translation.service';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error-message';
import type { DashboardKpis, SparklineItem } from '../domain/model/dashboard-view.model';

/**
 * Agronomist desk dashboard — real backend only.
 * Sources: recommendations, interventions, edge gateways, sensor readings, sector health.
 */
@Injectable({ providedIn: 'root' })
export class CropMonitoringDashboardStore {
  private readonly recommendationService = inject(RecommendationService);
  private readonly sensorReadingService = inject(SensorReadingService);
  private readonly edgeGatewayService = inject(EdgeGatewayService);
  private readonly iotContext = inject(IotDeviceContextService);
  private readonly interventionApi = inject(InterventionApiService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly sectorId = signal(environment.demo.sectorId ?? 1);

  readonly recommendations = signal<Recommendation[]>([]);
  readonly pendingRecommendations = signal<Recommendation[]>([]);
  readonly interventions = signal<AgronomicInterventionDto[]>([]);
  readonly latestReadings = signal<SensorReading[]>([]);
  readonly trendReadings = signal<SensorReading[]>([]);
  readonly gateways = signal<{ mac: string; isConnected: boolean; status: string }[]>([]);
  readonly sectorHealth = signal<SectorHealthDto | null>(null);

  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  readonly kpis = computed((): DashboardKpis => {
    const pending = this.pendingRecommendations();
    const published = this.recommendations();
    const gateways = this.gateways();
    const health = this.sectorHealth();
    return {
      pendingRecommendations: pending.length,
      publishedRecommendations: published.length,
      interventions: this.interventions().length,
      gatewaysConnected: gateways.filter((g) => g.isConnected).length,
      gatewaysTotal: gateways.length,
      latestReadings: this.latestReadings().length,
      sectorHealthStatus: health?.status ?? null,
    };
  });

  readonly connectedCount = computed(() => this.kpis().gatewaysConnected);
  readonly offlineCount = computed(() => 0);
  readonly disconnectedCount = computed(
    () => this.kpis().gatewaysTotal - this.kpis().gatewaysConnected,
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

    // Order matches backend SensorType: Temperature, Humidity, PH, Luminosity, SoilMoisture
    const configs: {
      key: string;
      label: string;
      unit: string;
      color: string;
    }[] = [
      {
        key: 'temperature',
        label: this.t.translate('dashboard.sparkline.temperature'),
        unit: '°C',
        color: 'var(--color-warning)',
      },
      {
        key: 'soil_humidity',
        label: this.t.translate('dashboard.sparkline.soilHumidity'),
        unit: '%',
        color: 'var(--color-accent-cyan)',
      },
      {
        key: 'soil_moisture',
        label: this.t.translate('dashboard.sparkline.soilMoisture'),
        unit: '%',
        color: 'var(--color-brand-primary)',
      },
      {
        key: 'soil_ph',
        label: this.t.translate('dashboard.sparkline.soilPh'),
        unit: '',
        color: 'var(--color-success)',
      },
      {
        key: 'luminosity',
        label: this.t.translate('dashboard.sparkline.luminosity'),
        unit: 'lux',
        color: 'var(--color-accent-cyan-bright)',
      },
    ];

    const width = 200;
    const height = 56;
    const padX = 4;
    const padY = 6;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const items: SparklineItem[] = [];
    for (const cfg of configs) {
      const groupReadings = grouped.get(cfg.key);
      if (!groupReadings?.length) continue;

      const sorted = [...groupReadings].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      );
      const values = sorted.map((r) => r.value);
      const currentValue = sorted[sorted.length - 1].value;
      const vMin = Math.min(...values);
      const vMax = Math.max(...values);
      const hasTrend = sorted.length >= 2;
      const buffer = (vMax - vMin) * 0.18 || Math.abs(currentValue) * 0.05 || 0.5;
      const yMin = vMin - buffer;
      const yMax = vMax + buffer;
      const yRange = yMax - yMin || 1;

      const coords = sorted.map((r, i) => {
        const x =
          sorted.length === 1
            ? width / 2
            : padX + (i / (sorted.length - 1)) * plotW;
        const y = padY + plotH - ((r.value - yMin) / yRange) * plotH;
        return { x, y };
      });

      const points = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
      const first = coords[0];
      const last = coords[coords.length - 1];
      const areaPoints = hasTrend
        ? `${first.x.toFixed(1)},${(height - padY).toFixed(1)} ${points} ${last.x.toFixed(1)},${(height - padY).toFixed(1)}`
        : '';

      let trend: SparklineItem['trend'] = 'stable';
      if (hasTrend) {
        const firstVal = sorted[0].value;
        const lastVal = currentValue;
        const span = Math.abs(vMax - vMin) || 1;
        const delta = lastVal - firstVal;
        if (delta > span * 0.08) trend = 'up';
        else if (delta < -span * 0.08) trend = 'down';
      }

      items.push({
        key: cfg.key,
        label: cfg.label,
        unit: cfg.unit,
        color: cfg.color,
        currentValue,
        vMin,
        vMax,
        points,
        areaPoints,
        sampleCount: sorted.length,
        hasTrend,
        trend,
      });
    }
    return items;
  });

  readonly topPendingRecommendation = computed(() => {
    const list = this.pendingRecommendations();
    return list[0] ?? null;
  });

  healthStatusLabel(status: number | null): string {
    if (status === null) return this.t.translate('dashboard.health.unknown');
    if (status === 0) return this.t.translate('dashboard.health.optimal');
    if (status === 1) return this.t.translate('dashboard.health.atRisk');
    return this.t.translate('dashboard.health.critical');
  }

  healthStatusColor(status: number | null): string {
    if (status === null) return 'var(--color-text-muted)';
    if (status === 0) return 'var(--color-success)';
    if (status === 1) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set('');
    const sectorId = this.sectorId();
    const f = environment.features;
    const emptyRecs = {
      recommendations: [] as Recommendation[],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    };
    const emptyReadings = {
      readings: [] as SensorReading[],
      totalElements: 0,
      totalPages: 0,
      page: 1,
      size: 0,
    };

    // Discover live gateway/device MACs first (avoids seed MAC 404s on Render).
    this.iotContext
      .resolve()
      .pipe(
        switchMap((ctx) => {
          const deviceMac = ctx.deviceMac;
          return forkJoin({
            pendingRecs: f.recommendations
              ? this.recommendationService.list({ scope: 'sector', sectorId }).pipe(
                  catchError(() => of(emptyRecs)),
                )
              : of(emptyRecs),
            publishedRecs: f.recommendations
              ? this.recommendationService
                  .list({ scope: 'sector', sectorId, status: 'Published' })
                  .pipe(catchError(() => of(emptyRecs)))
              : of(emptyRecs),
            interventions: f.interventions
              ? this.interventionApi.listBySector(sectorId).pipe(catchError(() => of([])))
              : of([] as AgronomicInterventionDto[]),
            readings: f.sensors
              ? this.sensorReadingService
                  .list({ size: 8, deviceMac })
                  .pipe(catchError(() => of(emptyReadings)))
              : of(emptyReadings),
            trendData: f.sensors
              ? this.sensorReadingService
                  .list({ size: 72, deviceMac })
                  .pipe(catchError(() => of(emptyReadings)))
              : of(emptyReadings),
            gateways: f.iotStatus
              ? this.edgeGatewayService.listGateways().pipe(catchError(() => of([])))
              : of([]),
            sectorHealth: f.monitoring
              ? this.edgeGatewayService
                  .getSectorHealth(sectorId)
                  .pipe(catchError(() => of(null)))
              : of(null),
          });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({
          pendingRecs,
          publishedRecs,
          interventions,
          readings,
          trendData,
          gateways,
          sectorHealth,
        }) => {
          const all = pendingRecs.recommendations ?? [];
          this.pendingRecommendations.set(all.filter((r) => r.status !== 'published'));
          this.recommendations.set(publishedRecs.recommendations ?? []);
          this.interventions.set(interventions ?? []);
          this.latestReadings.set(readings.readings ?? []);
          this.trendReadings.set(trendData.readings ?? []);
          this.gateways.set(gateways ?? []);
          this.sectorHealth.set(sectorHealth);
        },
        error: (err: unknown) =>
          this.error.set(getApiErrorMessage(err, this.t.translate('dashboard.error.load'))),
      });
  }
}
