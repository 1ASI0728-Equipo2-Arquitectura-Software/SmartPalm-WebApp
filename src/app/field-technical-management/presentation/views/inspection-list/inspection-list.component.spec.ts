/**
 * Phase 2 — Inspection List i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { InspectionListComponent } from './inspection-list.component';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { InspectionService } from '../../../infrastructure/inspection-api.service';

@Component({ template: '' })
class DummyComponent {}

function setupTestBed(locale: 'es' | 'en') {
  const mockAuthService = { currentUser: { role: 'agronomist' } };
  const mockInspectionService = {
    list: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
  };
  return TestBed.configureTestingModule({
    imports: [InspectionListComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AuthService, useValue: mockAuthService },
      { provide: InspectionService, useValue: mockInspectionService },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'inspecciones', component: DummyComponent },
        { path: 'inspecciones/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'insp.list.badge.agronomist': 'Agronomist segment',
  'insp.list.badge.grower': 'Grower segment',
  'insp.list.heading': 'Field Inspections',
  'insp.list.subtitle': 'History of technical inspections performed on the plantations under your charge.',
  'insp.list.counter': 'inspections',
  'insp.list.loading': 'Loading inspections...',
  'insp.list.empty': 'No inspections',
  'insp.list.emptyDesc': 'No field inspections have been recorded in the system.',
};

describe('InspectionListComponent — i18n (Spanish)', () => {
  it('should show Spanish heading and empty state', async () => {
    await setupTestBed('es').compileComponents();
    const fixture = TestBed.createComponent(InspectionListComponent);
    fixture.detectChanges(); // let ngOnInit run (loading=true via mock)
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.inspections.set([]);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Inspecciones de campo');
    expect(el.textContent).toContain('Sin inspecciones');
    expect(el.textContent).toContain('inspecciones');
  });
});

describe('InspectionListComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(EN); });

  it('should show English heading and empty state', async () => {
    await setupTestBed('en').compileComponents();
    const fixture = TestBed.createComponent(InspectionListComponent);
    fixture.detectChanges(); // let ngOnInit run
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.inspections.set([]);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Field Inspections');
    expect(el.textContent).toContain('No inspections');
  });
});
