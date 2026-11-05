/**
 * Dashboard — agronomist desk i18n smoke tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { CropMonitoringDashboardStore } from '../../../application/crop-monitoring-dashboard.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({ template: '' })
class DummyComponent {}

const ES: Record<string, string> = {
  'dashboard.heading.agronomist': 'Panel de control agronómico',
  'dashboard.subtitle.agronomist':
    'Resumen del sector: salud, recomendaciones, intervenciones y sensores.',
  'dashboard.loading': 'Cargando dashboard...',
  'dashboard.refresh': 'Actualizar',
  'dashboard.context.sector': 'Sector {{id}}',
  'dashboard.context.sectorChip': 'Sector {{id}}',
  'dashboard.kpi.pendingRecs': 'Recs. pendientes',
  'dashboard.kpi.publishedRecs': 'Recs. publicadas',
  'dashboard.kpi.interventions': 'Intervenciones',
  'dashboard.kpi.gateways': 'Gateways',
  'dashboard.kpi.sectorHealth': 'Salud del sector',
  'dashboard.quick.monitoring': 'Monitoreo',
  'dashboard.quick.monitoringHint': 'Gateways, umbrales y lecturas',
  'dashboard.quick.recommendations': 'Recomendaciones',
  'dashboard.quick.recommendationsHint': 'Cola de revisión y publicadas',
  'dashboard.quick.interventions': 'Intervenciones',
  'dashboard.quick.interventionsHint': 'Registro de campo del sector',
  'dashboard.pendingQueue': 'Cola de revisión',
  'dashboard.recommendations': 'Publicadas',
  'dashboard.interventions': 'Intervenciones del sector',
  'dashboard.emptyPending': 'No hay recomendaciones pendientes en este sector.',
  'dashboard.emptyPublished': 'Aún no hay recomendaciones publicadas.',
  'dashboard.emptyInterventions': 'Aún no hay intervenciones registradas.',
  'dashboard.devices.agronomist': 'Edge gateways',
  'dashboard.devices.connected': 'Conectados',
  'dashboard.devices.disconnected': 'Desconectados',
  'dashboard.noGateways': 'Sin gateways registrados.',
  'dashboard.trends.heading': 'Tendencias de sensores',
  'dashboard.trends.subtitle': 'Variables reportadas por el dispositivo del sector',
  'dashboard.trends.empty': 'Aún no hay lecturas suficientes para mostrar tendencias.',
  'dashboard.trends.insufficient': 'Pocos puntos para trazar tendencia',
  'dashboard.trends.samples': '{{n}} lecturas',
  'dashboard.trend.up': 'Subiendo',
  'dashboard.trend.down': 'Bajando',
  'dashboard.trend.stable': 'Estable',
  'dashboard.health.agronomist': 'Salud del sector',
  'dashboard.health.optimal': 'Óptimo',
  'dashboard.health.atRisk': 'En riesgo',
  'dashboard.health.critical': 'Crítico',
  'dashboard.health.unknown': 'Sin datos',
  'dashboard.readings.agronomist': 'Últimas lecturas',
  'dashboard.noRecentReadings': 'Sin lecturas recientes para el dispositivo configurado.',
  'dashboard.viewAll': 'Ver todas',
  'dashboard.table.variable': 'Variable',
  'dashboard.table.value': 'Valor',
  'dashboard.table.iotMac': 'IoT MAC',
  'dashboard.table.time': 'Hora',
  'dashboard.recStatus.pending': 'Pendiente',
  'dashboard.recStatus.approved': 'Aprobada',
  'dashboard.recStatus.published': 'Publicada',
};

const EN: Record<string, string> = {
  'dashboard.heading.agronomist': 'Agronomic control panel',
  'dashboard.subtitle.agronomist':
    'Sector summary: health, recommendations, interventions and sensors.',
  'dashboard.loading': 'Loading dashboard...',
  'dashboard.refresh': 'Refresh',
  'dashboard.context.sector': 'Sector {{id}}',
  'dashboard.context.sectorChip': 'Sector {{id}}',
  'dashboard.kpi.pendingRecs': 'Pending recs',
  'dashboard.kpi.publishedRecs': 'Published recs',
  'dashboard.kpi.interventions': 'Interventions',
  'dashboard.kpi.gateways': 'Gateways',
  'dashboard.kpi.sectorHealth': 'Sector health',
  'dashboard.quick.monitoring': 'Monitoring',
  'dashboard.quick.monitoringHint': 'Gateways, thresholds and readings',
  'dashboard.quick.recommendations': 'Recommendations',
  'dashboard.quick.recommendationsHint': 'Review queue and published',
  'dashboard.quick.interventions': 'Interventions',
  'dashboard.quick.interventionsHint': 'Field records for the sector',
  'dashboard.pendingQueue': 'Review queue',
  'dashboard.recommendations': 'Published',
  'dashboard.interventions': 'Sector interventions',
  'dashboard.emptyPending': 'No pending recommendations in this sector.',
  'dashboard.emptyPublished': 'No published recommendations yet.',
  'dashboard.emptyInterventions': 'No interventions registered yet.',
  'dashboard.devices.agronomist': 'Edge gateways',
  'dashboard.devices.connected': 'Connected',
  'dashboard.devices.disconnected': 'Disconnected',
  'dashboard.noGateways': 'No gateways registered.',
  'dashboard.trends.heading': 'Sensor trends',
  'dashboard.trends.subtitle': 'Variables reported by the sector device',
  'dashboard.trends.empty': 'Not enough readings yet to show trends.',
  'dashboard.trends.insufficient': 'Too few points to chart a trend',
  'dashboard.trends.samples': '{{n}} readings',
  'dashboard.trend.up': 'Rising',
  'dashboard.trend.down': 'Falling',
  'dashboard.trend.stable': 'Stable',
  'dashboard.health.agronomist': 'Sector health',
  'dashboard.health.optimal': 'Optimal',
  'dashboard.health.atRisk': 'At risk',
  'dashboard.health.critical': 'Critical',
  'dashboard.health.unknown': 'No data',
  'dashboard.readings.agronomist': 'Latest readings',
  'dashboard.noRecentReadings': 'No recent readings for the configured device.',
  'dashboard.viewAll': 'View all',
  'dashboard.table.variable': 'Variable',
  'dashboard.table.value': 'Value',
  'dashboard.table.iotMac': 'IoT MAC',
  'dashboard.table.time': 'Time',
  'dashboard.recStatus.pending': 'Pending',
  'dashboard.recStatus.approved': 'Approved',
  'dashboard.recStatus.published': 'Published',
};

function createStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    isAgronomist: () => true,
    loading: signal(false),
    error: signal(''),
    sectorId: signal(1),
    recommendations: signal([]),
    pendingRecommendations: signal([]),
    interventions: signal([]),
    latestReadings: signal([]),
    trendReadings: signal([]),
    gateways: signal([]),
    sectorHealth: signal(null),
    kpis: signal({
      pendingRecommendations: 0,
      publishedRecommendations: 0,
      interventions: 0,
      gatewaysConnected: 0,
      gatewaysTotal: 0,
      latestReadings: 0,
      sectorHealthStatus: null as number | null,
    }),
    connectedCount: signal(0),
    offlineCount: signal(0),
    disconnectedCount: signal(0),
    sparklineItems: signal([]),
    topPendingRecommendation: signal(null),
    healthStatusLabel: (s: number | null) => (s === null ? 'Sin datos' : 'Óptimo'),
    healthStatusColor: () => 'var(--color-text-muted)',
    loadAll: vi.fn(),
  };
  return { ...defaults, ...overrides } as unknown as CropMonitoringDashboardStore;
}

function setup(locale: 'es' | 'en', store: CropMonitoringDashboardStore) {
  const map = locale === 'en' ? EN : ES;
  return TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [
      { provide: CropMonitoringDashboardStore, useValue: store },
      { provide: TranslationService, useValue: { translate: (k: string) => map[k] ?? k } },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'monitoreo', component: DummyComponent },
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
        { path: 'intervenciones', component: DummyComponent },
      ]),
    ],
  });
}

describe('DashboardComponent — agronomist desk (Spanish)', () => {
  it('shows Spanish heading and KPIs', async () => {
    const store = createStore({
      kpis: signal({
        pendingRecommendations: 2,
        publishedRecommendations: 1,
        interventions: 3,
        gatewaysConnected: 1,
        gatewaysTotal: 1,
        latestReadings: 0,
        sectorHealthStatus: 0,
      }),
      healthStatusLabel: () => 'Óptimo',
    });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/Panel de control agron[oó]mico/i);
    expect(text).toContain('Recs. pendientes');
    expect(text).toContain('Recs. publicadas');
    expect(text).toContain('Intervenciones');
    expect(text).toContain('Actualizar');
    expect(store.loadAll).toHaveBeenCalled();
  });

  it('shows Spanish loading state', async () => {
    const store = createStore({ loading: signal(true) });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando dashboard');
  });

  it('shows Spanish empty queues', async () => {
    const store = createStore();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cola de revisión');
    expect(text).toMatch(/No hay recomendaciones pendientes/i);
  });
});

describe('DashboardComponent — agronomist desk (English)', () => {
  it('shows English heading and KPIs', async () => {
    const store = createStore({
      kpis: signal({
        pendingRecommendations: 0,
        publishedRecommendations: 0,
        interventions: 0,
        gatewaysConnected: 0,
        gatewaysTotal: 0,
        latestReadings: 0,
        sectorHealthStatus: null,
      }),
      healthStatusLabel: () => 'No data',
    });
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Agronomic control panel');
    expect(text).toContain('Pending recs');
    expect(text).toContain('Published recs');
    expect(text).toContain('Refresh');
    expect(text).toContain('Monitoring');
    expect(text).toContain('Sector 1');
  });
});
