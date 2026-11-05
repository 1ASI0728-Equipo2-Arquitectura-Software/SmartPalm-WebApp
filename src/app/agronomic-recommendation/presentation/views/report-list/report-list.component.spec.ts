/**
 * Phase 2 — Report List Component i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { ReportListComponent } from './report-list.component';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';

@Component({ template: '' })
class DummyComponent {}

function createMockStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    isAgronomist: () => true,
    reports: signal([]),
    reportsLoading: signal(false),
    reportsError: signal(''),
    reportPlantations: signal([]),
    reportGeneratingPlantationId: signal(0),
    ...overrides,
  };
  return {
    ...defaults,
    loadReports: vi.fn(),
    loadPlantationsForReports: vi.fn(),
    generateDraftReport: vi.fn(() => ({ subscribe: vi.fn() })),
  } as unknown as AgronomicRecommendationStore;
}

function setupTestBed(locale: 'es' | 'en', store: ReturnType<typeof createMockStore>) {
  return TestBed.configureTestingModule({
    imports: [ReportListComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AgronomicRecommendationStore, useValue: store },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'reportes', component: DummyComponent },
        { path: 'reportes/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'report.list.badge.agronomist': 'Agronomist segment',
  'report.list.badge.grower': 'Grower segment',
  'report.list.heading': 'Reports',
  'report.list.subtitle.agronomist': 'Generate, review and publish technical reports for your growers.',
  'report.list.subtitle.grower': 'View technical reports published by your agronomist.',
  'report.list.counter': 'reports',
  'report.list.tab.drafts': 'Drafts',
  'report.list.tab.published': 'Published',
  'report.list.newReport': 'New Report',
  'report.list.generateBtn': 'Generate draft',
  'report.list.generating': 'Generating...',
  'report.list.selectPlantation': 'Select a plantation',
  'report.list.loading': 'Loading reports...',
  'report.list.emptyDrafts': 'No drafts',
  'report.list.emptyDraftsDesc': 'Use the form above to generate a new draft.',
  'report.list.emptyPublished': 'No published',
  'report.list.emptyPublishedDesc': 'No technical reports have been published yet.',
  'report.list.goToDrafts': 'Go to drafts',
  'report.list.status.draft': 'Draft',
  'report.list.status.published': 'Published',
};

describe('ReportListComponent — i18n (Spanish)', () => {
  it('should show Spanish heading and tabs', async () => {
    const store = createMockStore({ isAgronomist: () => true });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Reportes');
    expect(el.textContent).toContain('Borradores');
    expect(el.textContent).toContain('Publicados');
  });

  it('should show Spanish loading text', async () => {
    const store = createMockStore({ reportsLoading: () => true });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cargando reportes');
  });

  it('should show Spanish empty state', async () => {
    const store = createMockStore({ isAgronomist: () => true, reports: signal([]) });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.componentInstance.selectTab('drafts');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sin borradores');
  });

  it('should show Spanish generate section', async () => {
    const store = createMockStore({ isAgronomist: () => true });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.componentInstance.selectTab('drafts');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nuevo reporte');
    expect(el.textContent).toContain('Generar borrador');
  });

  it('should show Spanish status labels on cards', async () => {
    const store = createMockStore({
      reports: signal([
        { id: 1, title: 'Test', summary: 'Summary', plantationName: 'Farm', agronomistName: 'Dr. Test', status: 'published', publishedAt: null, createdAt: '2025-06-01' },
      ]),
    });
    await setupTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Publicado');
  });
});

describe('ReportListComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(EN); });

  it('should show English heading and tabs', async () => {
    const store = createMockStore({ isAgronomist: () => true });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Reports');
    expect(el.textContent).toContain('Drafts');
    expect(el.textContent).toContain('Published');
  });

  it('should show English loading text', async () => {
    const store = createMockStore({ reportsLoading: () => true });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Loading reports');
  });

  it('should show English generate section', async () => {
    const store = createMockStore({ isAgronomist: () => true });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.componentInstance.selectTab('drafts');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('New Report');
    expect(el.textContent).toContain('Generate draft');
  });

  it('should show English status labels', async () => {
    const store = createMockStore({
      reports: signal([
        { id: 1, title: 'Test', summary: 'Summary', plantationName: 'Farm', agronomistName: 'Dr. Test', status: 'draft', publishedAt: null, createdAt: '2025-06-01' },
      ]),
    });
    await setupTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(ReportListComponent);
    fixture.componentInstance.selectTab('drafts');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Draft');
  });
});
