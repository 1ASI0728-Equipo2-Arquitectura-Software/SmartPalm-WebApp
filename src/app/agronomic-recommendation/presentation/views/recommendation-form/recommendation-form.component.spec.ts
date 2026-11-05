/**
 * Recommendation Form — i18n + sector/general scope.
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RecommendationFormComponent } from './recommendation-form.component';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { TranslationService } from '../../../../i18n/translation.service';
import { createRecStoreMock, createTranslationMock } from '../../../testing/rec-test-helpers';

@Component({ template: '' })
class DummyComponent {}

function setup(locale: 'es' | 'en', store: AgronomicRecommendationStore) {
  return TestBed.configureTestingModule({
    imports: [RecommendationFormComponent],
    providers: [
      { provide: AgronomicRecommendationStore, useValue: store },
      { provide: TranslationService, useValue: createTranslationMock(locale) },
      provideRouter([
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'recomendaciones/:id', component: DummyComponent },
      ]),
    ],
  });
}

describe('RecommendationFormComponent — i18n (Spanish)', () => {
  it('shows Spanish title, scope and fields', async () => {
    const store = createRecStoreMock();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationFormComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toMatch(/Nueva recomendaci[oó]n/i);
    expect(text).toContain('Alcance');
    expect(text).toMatch(/Sector espec[ií]fico/i);
    expect(text).toMatch(/General/i);
    expect(text).toMatch(/ID de sector/i);
    expect(text).toMatch(/T[ií]tulo/i);
    expect(text).toMatch(/Descripci[oó]n/i);
    expect(text).toContain('Prioridad');
    expect(text).toMatch(/Crear recomendaci[oó]n/i);
    expect(text).toContain('Cancelar');
  });

  it('shows Spanish priority options', async () => {
    const store = createRecStoreMock();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationFormComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Baja');
    expect(text).toContain('Media');
    expect(text).toContain('Alta');
    expect(text).toMatch(/Cr[ií]tica/i);
  });

  it('prepares form and clears sector validators for general scope', async () => {
    const store = createRecStoreMock();
    await setup('es', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationFormComponent);
    fixture.detectChanges();
    expect(store.prepareForm).toHaveBeenCalled();

    const comp = fixture.componentInstance;
    expect(comp.form.controls.scope.value).toBe('sector');
    expect(comp.form.controls.sectorId.enabled).toBe(true);

    // Assert reactive form rules without a second CD cycle (template styles bind to form value).
    comp.form.controls.scope.setValue('general');
    expect(comp.form.controls.scope.value).toBe('general');
    // Validators cleared for general scope (min/required no longer block).
    comp.form.controls.sectorId.setValue(0);
    expect(comp.form.controls.sectorId.valid).toBe(true);
  });
});

describe('RecommendationFormComponent — i18n (English)', () => {
  it('shows English title and fields', async () => {
    const store = createRecStoreMock();
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationFormComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('New recommendation');
    expect(text).toContain('Scope');
    expect(text).toContain('Sector-specific');
    expect(text).toContain('Title');
    expect(text).toContain('Description');
    expect(text).toContain('Priority');
    expect(text).toContain('Create recommendation');
    expect(text).toContain('Cancel');
  });

  it('shows English priority options', async () => {
    const store = createRecStoreMock();
    await setup('en', store).compileComponents();
    const fixture = TestBed.createComponent(RecommendationFormComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Low');
    expect(text).toContain('Medium');
    expect(text).toContain('High');
    expect(text).toContain('Critical');
  });
});
