/**
 * Recommendation Detail — i18n + approve/publish actions.
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { RecommendationDetailComponent } from './recommendation-detail.component';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { TranslationService } from '../../../../i18n/translation.service';
import {
  createRecStoreMock,
  createTranslationMock,
  mockRecommendation,
} from '../../../testing/rec-test-helpers';

@Component({ template: '' })
class DummyComponent {}

function setup(
  locale: 'es' | 'en',
  store: AgronomicRecommendationStore,
  id = '1',
) {
  return TestBed.configureTestingModule({
    imports: [RecommendationDetailComponent],
    providers: [
      { provide: AgronomicRecommendationStore, useValue: store },
      { provide: TranslationService, useValue: createTranslationMock(locale) },
      provideRouter([
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
      ]),
      // Must come after provideRouter so the component gets our params.
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ id }),
          },
        },
      },
    ],
  });
}

describe('RecommendationDetailComponent — i18n (Spanish)', () => {
  it('shows Spanish back link and loading text', async () => {
    const store = createRecStoreMock({ recommendationDetailLoading: signal(true) });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Volver a recomendaciones');
    expect(text).toContain('Cargando detalle');
  });

  it('shows Spanish sections and approve button for pending', async () => {
    const store = createRecStoreMock({
      recommendationDetail: signal(mockRecommendation({ status: 'pending_review' })),
      recommendationDetailLoading: signal(false),
      recommendationDetailError: signal(''),
    });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    // Avoid real load clearing mock detail
    store.loadRecommendationDetail = (() => undefined) as typeof store.loadRecommendationDetail;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toMatch(/Descripci[oó]n/i);
    expect(text).toMatch(/Acci[oó]n recomendada/i);
    expect(text).toContain('Resumen');
    expect(text).toMatch(/Informaci[oó]n de publicaci[oó]n/i);
    expect(text).toContain('Alcance');
    expect(text).toMatch(/Aprobar recomendaci[oó]n/i);
    expect(text).toContain('Sector #1');
  });

  it('shows Spanish publish button when approved', async () => {
    const store = createRecStoreMock({
      recommendationDetail: signal(mockRecommendation({ status: 'approved' })),
      recommendationDetailLoading: signal(false),
      recommendationDetailError: signal(''),
    });
    store.loadRecommendationDetail = (() => undefined) as typeof store.loadRecommendationDetail;
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toMatch(/Publicar recomendaci[oó]n/i);
  });

  it('shows Spanish priority/status labels', async () => {
    const store = createRecStoreMock({
      recommendationDetail: signal(
        mockRecommendation({ priority: 'critical', status: 'approved', hasExplicitPriority: true }),
      ),
      recommendationDetailLoading: signal(false),
      recommendationDetailError: signal(''),
    });
    store.loadRecommendationDetail = (() => undefined) as typeof store.loadRecommendationDetail;
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toMatch(/Cr[ií]tica/i);
    expect(text).toContain('Aprobada');
  });

  it('loads detail by route id', async () => {
    const store = createRecStoreMock({
      recommendationDetailLoading: signal(true),
    });
    await setup('es', store, '42').compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    expect(store.loadRecommendationDetail).toHaveBeenCalledWith(42);
  });
});

describe('RecommendationDetailComponent — i18n (English)', () => {
  it('shows English back link and loading text', async () => {
    const store = createRecStoreMock({ recommendationDetailLoading: signal(true) });
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Back to recommendations');
    expect(text).toContain('Loading detail');
  });

  it('shows English sections and approve button', async () => {
    const store = createRecStoreMock({
      recommendationDetail: signal(mockRecommendation({ status: 'pending_review' })),
      recommendationDetailLoading: signal(false),
      recommendationDetailError: signal(''),
    });
    store.loadRecommendationDetail = (() => undefined) as typeof store.loadRecommendationDetail;
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Description');
    expect(text).toContain('Recommended action');
    expect(text).toContain('Summary');
    expect(text).toContain('Publication info');
    expect(text).toContain('Scope');
    expect(text).toContain('Approve recommendation');
  });

  it('shows English priority/status labels', async () => {
    const store = createRecStoreMock({
      recommendationDetail: signal(
        mockRecommendation({ priority: 'high', status: 'approved', hasExplicitPriority: true }),
      ),
      recommendationDetailLoading: signal(false),
      recommendationDetailError: signal(''),
    });
    store.loadRecommendationDetail = (() => undefined) as typeof store.loadRecommendationDetail;
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationDetailComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('High');
    expect(text).toContain('Approved');
  });
});
