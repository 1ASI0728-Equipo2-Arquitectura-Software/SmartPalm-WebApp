/**
 * Phase 2 — Plantation List i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { PlantationListComponent } from './plantation-list.component';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { PlantationService } from '../../../infrastructure/plantation-api.service';

@Component({ template: '' })
class DummyComponent {}

function setupTestBed(locale: 'es' | 'en') {
  const mockAuthService = { currentUser: { role: 'agronomist' } };
  const mockPlantationService = {
    list: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
  };
  return TestBed.configureTestingModule({
    imports: [PlantationListComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AuthService, useValue: mockAuthService },
      { provide: PlantationService, useValue: mockPlantationService },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'plantaciones', component: DummyComponent },
        { path: 'plantaciones/:id', component: DummyComponent },
        { path: 'plantaciones/new', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'plant.list.badge.agronomist': 'Agronomist segment',
  'plant.list.badge.grower': 'Grower segment',
  'plant.list.heading.agronomist': 'Plantation Portfolio',
  'plant.list.heading.grower': 'My Plantations',
  'plant.list.subtitle.agronomist': 'Technical oversight of all plantations under your charge.',
  'plant.list.subtitle.grower': 'Manage your crops, monitoring zones and associated devices.',
  'plant.list.counter': 'plantations',
  'plant.list.loading': 'Loading plantations...',
  'plant.list.empty': 'No plantations registered',
  'plant.list.emptyDesc': 'Register your first plantation to begin monitoring by zones and devices.',
  'plant.list.createFirst': 'Create my first plantation',
  'plant.list.zones': 'Zones',
  'plant.list.devices': 'Devices',
  'plant.list.soil': 'Soil',
  'plant.list.phase.produccion': 'Production',
  'plant.list.phase.establecimiento': 'Establishment',
  'plant.list.health.optimal': 'Optimal',
  'plant.list.health.atRisk': 'At Risk',
  'plant.list.health.critical': 'Critical',
};

const mockPlantationVm = {
  id: 1, name: 'Finca Palma Sur', location: 'Region Sur', totalHectares: 50,
  phenologicalPhase: 'produccion', zonesCount: 3, devicesCount: 5,
  soilType: 'franco_arenoso', overallHealth: 'optimal' as const,
  connectedDevices: 5,
  activeAlerts: 0,
};

describe('PlantationListComponent — i18n (Spanish)', () => {
  it('should show Spanish labels with data', async () => {
    await setupTestBed('es').compileComponents();
    const fixture = TestBed.createComponent(PlantationListComponent);
    fixture.detectChanges(); // let ngOnInit run (loading=true)
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.plantations.set([mockPlantationVm]);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cartera de plantaciones');
    expect(el.textContent).toContain('Optimo');
    expect(el.textContent).toContain('Zonas');
    expect(el.textContent).toContain('Dispositivos');
    expect(el.textContent).toContain('Suelo');
  });
});

describe('PlantationListComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(EN); });

  it('should show English labels with data', async () => {
    await setupTestBed('en').compileComponents();
    const fixture = TestBed.createComponent(PlantationListComponent);
    fixture.detectChanges(); // let ngOnInit run
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.plantations.set([mockPlantationVm]);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Plantation Portfolio');
    expect(el.textContent).toContain('Optimal');
    expect(el.textContent).toContain('Zones');
    expect(el.textContent).toContain('Devices');
    expect(el.textContent).toContain('Soil');
  });
});
