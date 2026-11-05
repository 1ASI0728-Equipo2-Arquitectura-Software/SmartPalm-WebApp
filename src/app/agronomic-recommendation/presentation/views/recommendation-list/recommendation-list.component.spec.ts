/**
 * Recommendation List — i18n + navigation smoke tests.
 * Uses real assets/i18n via TranslationService mock (not $localize).
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { RecommendationListComponent } from './recommendation-list.component';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { TranslationService } from '../../../../i18n/translation.service';
import {
  createRecStoreMock,
  createTranslationMock,
  mockRecommendation,
} from '../../../testing/rec-test-helpers';

@Component({ template: '' })
class DummyComponent {}

function setup(locale: 'es' | 'en', store: AgronomicRecommendationStore) {
  return TestBed.configureTestingModule({
    imports: [RecommendationListComponent],
    providers: [
      { provide: AgronomicRecommendationStore, useValue: store },
      { provide: TranslationService, useValue: createTranslationMock(locale) },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'recomendaciones/new', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
      ]),
    ],
  });
}

describe('RecommendationListComponent — i18n (Spanish)', () => {
  it('shows Spanish heading, badge, scope and tabs', async () => {
    const store = createRecStoreMock();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Recomendaciones');
    expect(text).toMatch(/Segmento agr[oó]nomo/i);
    expect(text).toContain('Pendientes');
    expect(text).toContain('Publicadas');
    expect(text).toContain('Por sector');
    expect(text).toContain('Generales');
    expect(text).toContain('+ Nueva');
    expect(text).toContain('Actualizar');
  });

  it('shows Spanish loading state', async () => {
    const store = createRecStoreMock({ recommendationsLoading: signal(true) });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando recomendaciones');
  });

  it('shows Spanish empty pending state', async () => {
    const store = createRecStoreMock({ recommendations: signal([]) });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.componentInstance.selectTab('pending');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sin pendientes');
    expect(text).toMatch(/Crear primera recomendaci[oó]n/i);
  });

  it('shows Spanish empty published state', async () => {
    const store = createRecStoreMock({ recommendations: signal([]) });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.componentInstance.selectTab('published');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin publicadas');
  });

  it('renders card with priority and navigable id', async () => {
    const store = createRecStoreMock({
      recommendations: signal([
        mockRecommendation({
          id: 11,
          status: 'published',
          priority: 'critical',
          hasExplicitPriority: true,
          title: 'Critica test',
        }),
      ]),
    });
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.componentInstance.selectTab('published');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/Cr[ií]tica/i);
    expect(el.textContent).toContain('Publicada');
    const link = el.querySelector('a[href*="recomendaciones"]') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href') ?? link?.getAttribute('ng-reflect-router-link') ?? '').toMatch(/11|recomendaciones/);
  });

  it('loads sector scope on init', async () => {
    const store = createRecStoreMock();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.detectChanges();
    expect(store.loadRecommendations).toHaveBeenCalled();
  });
});

describe('RecommendationListComponent — i18n (English)', () => {
  it('shows English heading, scope and tabs', async () => {
    const store = createRecStoreMock();
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Recommendations');
    expect(text).toContain('Agronomist segment');
    expect(text).toContain('Pending');
    expect(text).toContain('Published');
    expect(text).toContain('By sector');
    expect(text).toContain('General');
    expect(text).toContain('Refresh');
  });

  it('shows English loading and empty states', async () => {
    const loadingStore = createRecStoreMock({ recommendationsLoading: signal(true) });
    await setup('en', loadingStore).compileComponents();
    let fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading recommendations');

    TestBed.resetTestingModule();
    const emptyStore = createRecStoreMock({ recommendations: signal([]) });
    await setup('en', emptyStore).compileComponents();
    fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.componentInstance.selectTab('pending');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pending');
  });

  it('shows English priority label on published card', async () => {
    const store = createRecStoreMock({
      recommendations: signal([
        mockRecommendation({
          id: 4,
          status: 'published',
          priority: 'critical',
          hasExplicitPriority: true,
        }),
      ]),
    });
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationListComponent);
    fixture.componentInstance.selectTab('published');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Critical');
    expect(text).toContain('Published');
  });
});
