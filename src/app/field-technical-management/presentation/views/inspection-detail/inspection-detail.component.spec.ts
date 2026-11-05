/**
 * Phase 2 — Inspection Detail i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { InspectionDetailComponent } from './inspection-detail.component';
import { InspectionService } from '../../../infrastructure/inspection-api.service';

@Component({ template: '' })
class DummyComponent {}

function setupTestBed(locale: 'es' | 'en') {
  const mockInspectionService = {
    getById: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
  };
  return TestBed.configureTestingModule({
    imports: [InspectionDetailComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: InspectionService, useValue: mockInspectionService },
      provideRouter([
        { path: 'inspecciones', component: DummyComponent },
        { path: 'inspecciones/:id', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'insp.detail.back': '← Back to inspections',
  'insp.detail.badge': 'Field Inspection',
  'insp.detail.loading': 'Loading inspection...',
  'insp.detail.observations': 'Observations',
  'insp.detail.findings': 'Findings',
  'insp.detail.summary': 'Summary',
  'insp.detail.interventions': 'Interventions',
  'insp.detail.noInterventions': 'No interventions associated with this inspection were recorded.',
  'insp.detail.executedBy': 'Executed by',
  'insp.detail.on': 'on',
};

const mockInspection = {
  id: 1, plantationName: 'Finca Test', zoneName: 'Zona A',
  agronomistName: 'Dr. Test', inspectionDate: '2025-06-15T10:00:00Z',
  observations: 'Everything in order', findings: 'No issues found',
  interventions: [],
};

describe('InspectionDetailComponent — i18n (Spanish)', () => {
  it('should show Spanish headings with data', async () => {
    await setupTestBed('es').compileComponents();
    const fixture = TestBed.createComponent(InspectionDetailComponent);
    fixture.detectChanges(); // let ngOnInit run (loading=true from mock)
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.inspection.set(mockInspection as any);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Inspeccion de campo');
    expect(el.textContent).toContain('Observaciones');
    expect(el.textContent).toContain('Hallazgos');
    expect(el.textContent).toContain('Resumen');
    expect(el.textContent).toContain('Intervenciones');
  });
});

describe('InspectionDetailComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(EN); });

  it('should show English headings with data', async () => {
    await setupTestBed('en').compileComponents();
    const fixture = TestBed.createComponent(InspectionDetailComponent);
    fixture.detectChanges(); // let ngOnInit run
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.inspection.set(mockInspection as any);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Field Inspection');
    expect(el.textContent).toContain('Observations');
    expect(el.textContent).toContain('Findings');
  });
});
