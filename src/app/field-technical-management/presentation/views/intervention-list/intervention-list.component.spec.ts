/**
 * Intervention list — i18n + published-rec select smoke tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { InterventionListComponent } from './intervention-list.component';
import { InterventionApiService } from '../../../infrastructure/intervention-api.service';
import { RecommendationService } from '../../../../agronomic-recommendation/infrastructure/recommendation-api.service';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({ template: '' })
class DummyComponent {}

const ES: Record<string, string> = {
  'interv.heading': 'Intervenciones de campo',
  'interv.subtitle':
    'Registra y consulta intervenciones por sector. Opcionalmente enlaza una recomendación publicada.',
  'interv.loading': 'Cargando intervenciones...',
  'interv.empty': 'Aún no hay intervenciones en este sector.',
  'interv.formTitle': 'Nueva intervención',
  'interv.listHeading': 'Historial del sector',
  'interv.description': 'Descripción',
  'interv.performedBy': 'Realizada por',
  'interv.executionDate': 'Fecha de ejecución',
  'interv.originRecommendationId': 'Recomendación de origen (opcional)',
  'interv.recNone': 'Sin recomendación vinculada',
  'interv.recsLoading': 'Cargando recomendaciones publicadas...',
  'interv.recsEmpty': 'No hay recomendaciones publicadas en este sector.',
  'interv.publishedHint': 'Solo se listan recomendaciones con estado Published.',
  'interv.recommendationRef': 'Rec. #{{id}}',
  'interv.openRecommendation': 'Ver recomendación',
  'interv.submit': 'Registrar intervención',
  'interv.saving': 'Registrando...',
  'interv.contextSector': 'Sector #{{id}}',
  'interv.refresh': 'Actualizar',
  'interv.backDashboard': 'Dashboard',
  'interv.counter': 'intervenciones',
  'interv.created': 'Intervención registrada correctamente.',
  'interv.error.load': 'No se pudieron cargar las intervenciones.',
  'interv.error.create': 'No se pudo registrar la intervención.',
  'interv.error.invalidDate': 'Fecha de ejecución no válida.',
};

const EN: Record<string, string> = {
  'interv.heading': 'Field interventions',
  'interv.subtitle':
    'Register and review interventions by sector. Optionally link a published recommendation.',
  'interv.loading': 'Loading interventions...',
  'interv.empty': 'No interventions in this sector yet.',
  'interv.formTitle': 'New intervention',
  'interv.listHeading': 'Sector history',
  'interv.description': 'Description',
  'interv.performedBy': 'Performed by',
  'interv.executionDate': 'Execution date',
  'interv.originRecommendationId': 'Origin recommendation (optional)',
  'interv.recNone': 'No linked recommendation',
  'interv.recsLoading': 'Loading published recommendations...',
  'interv.recsEmpty': 'No published recommendations in this sector.',
  'interv.publishedHint': 'Only recommendations with Published status are listed.',
  'interv.recommendationRef': 'Rec. #{{id}}',
  'interv.openRecommendation': 'Open recommendation',
  'interv.submit': 'Register intervention',
  'interv.saving': 'Saving...',
  'interv.contextSector': 'Sector #{{id}}',
  'interv.refresh': 'Refresh',
  'interv.backDashboard': 'Dashboard',
  'interv.counter': 'interventions',
  'interv.created': 'Intervention registered successfully.',
  'interv.error.load': 'Could not load interventions.',
  'interv.error.create': 'Could not register the intervention.',
  'interv.error.invalidDate': 'Invalid execution date.',
};

function setup(locale: 'es' | 'en') {
  const map = locale === 'en' ? EN : ES;
  const interventionApi = {
    listBySector: vi.fn(() =>
      of([
        {
          id: 8,
          sectorId: 1,
          performedBy: 'Operador Campo',
          description: 'Accion desde rec publicada',
          executionDate: '2026-07-10T17:00:00Z',
          createdAt: '2026-07-10T10:00:00Z',
          recommendationId: 9,
        },
      ]),
    ),
    create: vi.fn(() =>
      of({
        id: 99,
        sectorId: 1,
        performedBy: 'Agronomist One',
        description: 'Nueva',
        executionDate: '2026-07-10T18:00:00Z',
        createdAt: '2026-07-10T11:00:00Z',
        recommendationId: null,
      }),
    ),
    getById: vi.fn(),
  };
  const recApi = {
    list: vi.fn(() =>
      of({
        recommendations: [
          {
            id: 9,
            title: 'Front smoke',
            content: 'Front smoke',
            status: 'published',
            clientKey: 'id:9',
            type: 'SectorSpecific',
            sectorId: 1,
            scopeLabel: 'Sector #1',
            plantationName: 'Sector #1',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        page: 1,
      }),
    ),
  };

  return TestBed.configureTestingModule({
    imports: [InterventionListComponent],
    providers: [
      { provide: InterventionApiService, useValue: interventionApi },
      { provide: RecommendationService, useValue: recApi },
      {
        provide: AuthService,
        useValue: {
          user: () => ({ id: 3, fullName: 'Agronomist One', email: 'agro1@smartpalm.com', role: 'agronomist' }),
        },
      },
      { provide: TranslationService, useValue: { translate: (k: string) => map[k] ?? k } },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
      ]),
    ],
  });
}

describe('InterventionListComponent — i18n (Spanish)', () => {
  it('shows Spanish headings and form labels', async () => {
    await setup('es').compileComponents();
    const fixture = TestBed.createComponent(InterventionListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/Intervenciones de campo/i);
    expect(text).toMatch(/Nueva intervenci[oó]n/i);
    expect(text).toMatch(/Descripci[oó]n/i);
    expect(text).toMatch(/Realizada por/i);
    expect(text).toMatch(/Recomendaci[oó]n de origen/i);
    expect(text).toMatch(/Registrar intervenci[oó]n/i);
    expect(text).toContain('Sector #1');
  });

  it('lists intervention and link to published recommendation', async () => {
    await setup('es').compileComponents();
    const fixture = TestBed.createComponent(InterventionListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Accion desde rec publicada');
    expect(text).toMatch(/Rec\. #9/i);
    expect(text).toMatch(/Ver recomendaci[oó]n/i);
  });
});

describe('InterventionListComponent — i18n (English)', () => {
  it('shows English headings', async () => {
    await setup('en').compileComponents();
    const fixture = TestBed.createComponent(InterventionListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Field interventions');
    expect(text).toContain('New intervention');
    expect(text).toContain('Register intervention');
    expect(text).toContain('Open recommendation');
  });
});
