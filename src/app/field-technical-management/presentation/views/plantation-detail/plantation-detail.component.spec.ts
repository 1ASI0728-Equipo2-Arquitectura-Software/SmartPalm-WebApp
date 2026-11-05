/**
 * Phase 2 — Plantation Detail i18n Tests (Strict TDD)
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { loadTranslations } from '@angular/localize';
import { PlantationDetailComponent } from './plantation-detail.component';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { PlantationService } from '../../../infrastructure/plantation-api.service';
import { AlertService } from '../../../../alert-and-notification/infrastructure/alert-and-notification-api';

@Component({ template: '' })
class DummyComponent {}

function setupTestBed(locale: 'es' | 'en') {
  const mockPlantationService = {
    getById: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
    listZones: vi.fn(() => ({ pipe: vi.fn(() => ({ subscribe: vi.fn() })) })),
  };
  const mockAlertService = {
    list: vi.fn(() => ({ subscribe: vi.fn() })),
  };
  const mockAuthService = {
    currentUser: { role: 'agronomist' },
  };
  return TestBed.configureTestingModule({
    imports: [PlantationDetailComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AuthService, useValue: mockAuthService },
      { provide: PlantationService, useValue: mockPlantationService },
      { provide: AlertService, useValue: mockAlertService },
      provideRouter([
        { path: 'plantaciones', component: DummyComponent },
        { path: 'plantaciones/:id', component: DummyComponent },
        { path: 'plantaciones/:id/edit', component: DummyComponent },
        { path: 'plantaciones/:id/zones/new', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
        { path: 'alertas/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const PLANTATION_ES: Record<string, string> = {
  'plant.detail.back.agronomist': 'Volver a cartera',
  'plant.detail.back.grower': 'Volver a plantaciones',
  'plant.detail.loading': 'Cargando detalle...',
  'plant.detail.health.optimal': 'Optimo',
  'plant.detail.health.atRisk': 'En riesgo',
  'plant.detail.health.critical': 'Critico',
  'plant.detail.phase.produccion': 'En produccion',
  'plant.detail.phase.establecimiento': 'En establecimiento',
  'plant.detail.zones': 'Zonas',
  'plant.detail.devices': 'Dispositivos',
  'plant.detail.alerts': 'Alertas',
  'plant.detail.soil': 'Suelo:',
  'plant.detail.age': 'Antiguedad:',
  'plant.detail.updated': 'Actualizado:',
  'plant.detail.editBtn': 'Editar plantacion',
  'plant.detail.addZoneBtn': 'Agregar zona',
  'plant.detail.monitoringZones': 'Zonas de monitoreo',
  'plant.detail.zonesRegistered': 'zonas registradas',
  'plant.detail.loadingZones': 'Cargando zonas...',
  'plant.detail.noZones': 'Sin zonas registradas',
  'plant.detail.soil.arcillosoHumedo': 'Arcilloso humedo',
  'plant.detail.soil.francoArenoso': 'Franco arenoso',
  'plant.detail.soil.francoArcilloso': 'Franco arcilloso',
  'plant.detail.soil.arenoso': 'Arenoso',
  'plant.detail.noZonesDescAgronomist': 'Esta plantacion aun no tiene zonas de monitoreo definidas.',
  'plant.detail.noZonesDescGrower': 'Crea la primera zona para preparar la asignacion de dispositivos.',
  'plant.detail.createFirstZone': 'Crear primera zona',
  'plant.detail.health.zone.critical': 'Critico',
  'plant.detail.health.zone.atRisk': 'Atencion',
  'plant.detail.noDescription': 'Sin descripcion.',
  'plant.detail.error.invalid': 'Plantacion no valida.',
  'plant.detail.error.load': 'No se pudo cargar la plantacion.',
};

const PLANTATION_EN: Record<string, string> = {
  'plant.detail.back.agronomist': '← Back to portfolio',
  'plant.detail.back.grower': '← Back to plantations',
  'plant.detail.loading': 'Loading detail...',
  'plant.detail.health.optimal': 'Optimal',
  'plant.detail.health.atRisk': 'At Risk',
  'plant.detail.health.critical': 'Critical',
  'plant.detail.phase.produccion': 'In Production',
  'plant.detail.phase.establecimiento': 'In Establishment',
  'plant.detail.zones': 'Zones',
  'plant.detail.devices': 'Devices',
  'plant.detail.alerts': 'Alerts',
  'plant.detail.soil': 'Soil:',
  'plant.detail.age': 'Age:',
  'plant.detail.updated': 'Updated:',
  'plant.detail.editBtn': 'Edit plantation',
  'plant.detail.addZoneBtn': 'Add zone',
  'plant.detail.monitoringZones': 'Monitoring Zones',
  'plant.detail.zonesRegistered': 'zones registered',
  'plant.detail.loadingZones': 'Loading zones...',
  'plant.detail.noZones': 'No zones registered',
  'plant.detail.soil.arcillosoHumedo': 'Clayey moist',
  'plant.detail.soil.francoArenoso': 'Sandy loam',
  'plant.detail.soil.francoArcilloso': 'Clay loam',
  'plant.detail.soil.arenoso': 'Sandy',
  'plant.detail.noZonesDescAgronomist': 'This plantation does not yet have monitoring zones defined.',
  'plant.detail.noZonesDescGrower': 'Create the first zone to prepare device assignment.',
  'plant.detail.createFirstZone': 'Create first zone',
  'plant.detail.health.zone.critical': 'Critical',
  'plant.detail.health.zone.atRisk': 'At Risk',
  'plant.detail.noDescription': 'No description.',
  'plant.detail.error.invalid': 'Invalid plantation.',
  'plant.detail.error.load': 'Could not load the plantation.',
};

const mockPlantation = {
  id: 1, name: 'Finca Test', location: 'Region Sur', totalHectares: 50,
  phenologicalPhase: 'produccion', zonesCount: 3, devicesCount: 5,
  soilType: 'franco_arenoso', overallHealth: 'optimal' as const,
  cropAge: '2 años', updatedAt: '2025-06-15',
};

describe('PlantationDetailComponent — i18n (Spanish)', () => {
  it('should show Spanish labels with data', async () => {
    loadTranslations(PLANTATION_ES);
    await setupTestBed('es').compileComponents();
    const fixture = TestBed.createComponent(PlantationDetailComponent);
    fixture.detectChanges(); // let ngOnInit run (loading=true)
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.plantation.set(mockPlantation as any);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Optimo');
    expect(el.textContent).toContain('En produccion');
    expect(el.textContent).toContain('Zonas');
    expect(el.textContent).toContain('Dispositivos');
    expect(el.textContent).toContain('Alertas');
    expect(el.textContent).toContain('Suelo:');
    expect(el.textContent).toContain('Antiguedad:');
  });
});

describe('PlantationDetailComponent — i18n (English)', () => {
  beforeAll(() => { loadTranslations(PLANTATION_EN); });

  it('should show English labels with data', async () => {
    await setupTestBed('en').compileComponents();
    const fixture = TestBed.createComponent(PlantationDetailComponent);
    fixture.detectChanges(); // let ngOnInit run
    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.plantation.set(mockPlantation as any);
    fixture.detectChanges(); // re-render with data
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Optimal');
    expect(el.textContent).toContain('Zones');
    expect(el.textContent).toContain('Devices');
    expect(el.textContent).toContain('Alerts');
  });
});
