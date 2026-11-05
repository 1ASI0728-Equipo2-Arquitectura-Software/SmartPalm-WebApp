/**
 * Phase 2 — Report Detail Component i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { ReportDetailComponent } from './report-detail.component';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';

@Component({ template: '' })
class DummyComponent {}

function createMockStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    isAgronomist: () => true,
    reportDetail: signal(null),
    reportDetailLoading: signal(false),
    reportDetailError: signal(''),
    reportActionLoading: signal(''),
    reportActionError: signal(''),
    ...overrides,
  };
  return {
    ...defaults,
    loadReportDetail: vi.fn(),
    publishReport: vi.fn(() => ({ subscribe: vi.fn() })),
  } as unknown as AgronomicRecommendationStore;
}

function setupTestBed(locale: 'es' | 'en', store: ReturnType<typeof createMockStore>) {
  return TestBed.configureTestingModule({
    imports: [ReportDetailComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AgronomicRecommendationStore, useValue: store },
      provideRouter([
        { path: 'reportes', component: DummyComponent },
        { path: 'reportes/:id', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
        { path: 'alertas/:id', component: DummyComponent },
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'report.detail.back': '← Back to reports',
  'report.detail.loading': 'Loading report...',
  'report.detail.publishBtn': 'Publish report',
  'report.detail.publishing': 'Publishing...',
  'report.detail.exportPdf': 'Export PDF',
  'report.detail.status.draft': 'Draft',
  'report.detail.status.published': 'Published',
  'report.detail.cropHealth': 'Crop Health',
  'report.detail.overallStatus': 'Overall status:',
  'report.detail.health.critical': 'Critical',
  'report.detail.health.atRisk': 'At Risk',
  'report.detail.health.optimal': 'Optimal',
  'report.detail.sensorSummary': 'Sensor Summary',
  'report.detail.temp': 'Temp °C',
  'report.detail.humidity': 'Humidity %',
  'report.detail.activeAlerts': 'Active Alerts',
  'report.detail.recommendations': 'Recommendations',
};

describe('ReportDetailComponent — i18n (Spanish)', () => {
  it('should show Spanish back link and loading', async () => {
    const store = createMockStore({ reportDetailLoading: () => true });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Volver a reportes');
    expect(el.textContent).toContain('Cargando reporte');
  });

  it('should show Spanish section headings with data', async () => {
    const store = createMockStore({
      reportDetail: signal({
        id: 1, title: 'Reporte Test', summary: 'Resumen', plantationName: 'Finca',
        agronomistName: 'Dr. Test', status: 'draft',
        sections: {
          cropHealth: { overall: 'optimal', byZone: [] },
          sensorSummary: { avgTemperature: 28, avgHumidity: 65, avgPh: 6.5 },
          activeAlerts: [],
          recommendations: [],
        },
      }),
    });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Salud del cultivo');
    expect(el.textContent).toContain('Sensor Summary');
    expect(el.textContent).toContain('Temp °C');
    expect(el.textContent).toContain('Humedad %');
  });

  it('should show Spanish buttons', async () => {
    const store = createMockStore({
      reportDetail: signal({ id: 1, title: 'Test', summary: '', plantationName: 'Finca', agronomistName: 'Dr.', status: 'draft' }),
    });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Publicar reporte');
    expect(el.textContent).toContain('Exportar PDF');
  });
});

describe('ReportDetailComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(EN); });

  it('should show English back link and loading', async () => {
    const store = createMockStore({ reportDetailLoading: () => true });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Back to reports');
    expect(el.textContent).toContain('Loading report');
  });

  it('should show English section headings', async () => {
    const store = createMockStore({
      reportDetail: signal({
        id: 1, title: 'Test Report', summary: 'Summary', plantationName: 'Farm',
        agronomistName: 'Dr. Test', status: 'published',
        sections: {
          cropHealth: { overall: 'critical', byZone: [] },
          sensorSummary: { avgTemperature: 28, avgHumidity: 65, avgPh: 6.5 },
          activeAlerts: [],
          recommendations: [],
        },
      }),
    });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Crop Health');
  });

  it('should show English buttons', async () => {
    const store = createMockStore({
      reportDetail: signal({ id: 1, title: 'Test', summary: '', plantationName: 'Farm', agronomistName: 'Dr.', status: 'draft' }),
    });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportDetailComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Publish report');
    expect(el.textContent).toContain('Export PDF');
  });
});
