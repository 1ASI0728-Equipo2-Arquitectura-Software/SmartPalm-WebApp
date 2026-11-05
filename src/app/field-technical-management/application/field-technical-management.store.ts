import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { Plantation, CreatePlantationRequest, UpdatePlantationRequest } from '../domain/model/plantation.entity';
import { Zone, CreateZoneRequest, UpdateZoneRequest } from '../domain/model/zone.entity';
import { FieldInspection, InspectionListResponse } from '../domain/model/inspection.entity';
import { PlantationService } from '../infrastructure/plantation-api.service';
import { InspectionService } from '../infrastructure/inspection-api.service';
import { Bc01AccessService, Bc01WriteAccess } from '../infrastructure/bc01-access.service';

export interface PlantationVm {
  id: number;
  name: string;
  location: string;
  totalHectares: number;
  phenologicalPhase: string;
  zonesCount: number;
  devicesCount: number;
  soilType: string;
  overallHealth?: 'optimal' | 'at_risk' | 'critical' | null;
  connectedDevices: number;
  activeAlerts: number;
}

/**
 * Central state store for the Field Technical Management bounded context.
 *
 * Exposes readonly signals and orchestration methods so presentation views
 * consume pre‑computed state without duplicating fetch/update logic.
 */
@Injectable({ providedIn: 'root' })
export class FieldTechnicalManagementStore {
  private readonly plantationService = inject(PlantationService);
  private readonly inspectionService = inject(InspectionService);
  private readonly accessService = inject(Bc01AccessService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  // ── Plantation list state ────────────────────────────────────────
  readonly plantations = signal<PlantationVm[]>([]);
  readonly plantationsLoading = signal(false);
  readonly plantationsError = signal('');

  // ── Plantation detail state ───────────────────────────────────────
  readonly plantation = signal<Plantation | null>(null);
  readonly plantationLoading = signal(false);
  readonly plantationError = signal('');

  // ── Zones state (for a given plantation) ──────────────────────────
  readonly zones = signal<Zone[]>([]);
  readonly zonesLoading = signal(false);
  readonly zonesError = signal('');

  // ── Plantation form state ─────────────────────────────────────────
  readonly formSaving = signal(false);
  readonly formError = signal('');

  // ── Zone form state ───────────────────────────────────────────────
  readonly zoneSaving = signal(false);
  readonly zoneError = signal('');

  // ── Write‑access state (subscription‑gated) ───────────────────────
  readonly access = signal<Bc01WriteAccess | null>(null);
  readonly accessLoading = signal(false);
  readonly accessError = signal('');

  // ── Inspection list state ─────────────────────────────────────────
  readonly inspections = signal<FieldInspection[]>([]);
  readonly inspectionsLoading = signal(false);
  readonly inspectionsError = signal('');

  // ── Inspection detail state ───────────────────────────────────────
  readonly inspection = signal<FieldInspection | null>(null);
  readonly inspectionLoading = signal(false);
  readonly inspectionError = signal('');

  // ── Computed ──────────────────────────────────────────────────────
  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  readonly canWrite = computed(() => this.access()?.canWrite ?? false);
  readonly hectareLimitReached = computed(() => this.access()?.hectareLimitReached ?? false);
  readonly accessMessage = computed(() => this.access()?.message ?? '');

  // ── Plantation list ───────────────────────────────────────────────
  loadPlantations(): void {
    this.plantationsLoading.set(true);
    this.plantationsError.set('');

    // Backend still lacks GET /plantations for agronomist portfolio (CropMonitoring WIP).
    if (!environment.features.plantationsApi) {
      const now = new Date().toISOString();
      this.plantations.set([
        {
          id: environment.demo.plantationId,
          name: `Demo plantation #${environment.demo.plantationId}`,
          location: 'Demo / live backend',
          totalHectares: 10,
          phenologicalPhase: 'produccion',
          zonesCount: 0,
          devicesCount: 1,
          soilType: '—',
          overallHealth: null,
          connectedDevices: 0,
          activeAlerts: 0,
        },
      ]);
      this.plantationsLoading.set(false);
      return;
    }

    this.plantationService
      .list()
      .pipe(finalize(() => this.plantationsLoading.set(false)))
      .subscribe({
        next: (raw) => this.plantations.set(raw.map((p) => this.toVm(p))),
        error: () => this.plantationsError.set(this.t.translate('ftm.error.loadPlantations')),
      });
  }

  // ── Plantation detail ─────────────────────────────────────────────
  loadPlantation(id: number): void {
    this.plantationLoading.set(true);
    this.plantationError.set('');

    if (!environment.features.plantationsApi) {
      const now = new Date().toISOString();
      this.plantation.set({
        id: id || environment.demo.plantationId,
        userId: environment.demo.agronomistId,
        name: `Demo plantation #${id || environment.demo.plantationId}`,
        location: 'Demo / live backend (no GET /plantations)',
        totalHectares: 10,
        soilType: '—',
        cropAge: '—',
        phenologicalPhase: 'produccion',
        latitude: 0,
        longitude: 0,
        zonesCount: 0,
        devicesCount: 1,
        overallHealth: null,
        createdAt: now,
        updatedAt: now,
      });
      this.plantationLoading.set(false);
      return;
    }

    this.plantationService
      .getById(id)
      .pipe(finalize(() => this.plantationLoading.set(false)))
      .subscribe({
        next: (p) => this.plantation.set(p),
        error: () => this.plantationError.set(this.t.translate('ftm.error.loadPlantation')),
      });
  }

  loadPlantationZones(plantationId: number): void {
    this.zonesLoading.set(true);
    this.zonesError.set('');

    if (!environment.features.plantationsApi) {
      this.zones.set([]);
      this.zonesLoading.set(false);
      return;
    }

    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (z) => this.zones.set(z),
        error: () => this.zonesError.set(this.t.translate('ftm.error.loadZones')),
      });
  }

  // ── Plantation CRUD ───────────────────────────────────────────────
  createPlantation(request: CreatePlantationRequest): Observable<Plantation> {
    this.formSaving.set(true);
    this.formError.set('');
    return this.plantationService.create(request).pipe(
      tap({
        error: (err: unknown) => this.formError.set(this.apiMessage(err, 'No se pudo guardar la plantacion.')),
      }),
      finalize(() => this.formSaving.set(false)),
    );
  }

  updatePlantation(id: number, request: UpdatePlantationRequest): Observable<Plantation> {
    this.formSaving.set(true);
    this.formError.set('');
    return this.plantationService.update(id, request).pipe(
      tap({
        error: (err: unknown) => this.formError.set(this.apiMessage(err, 'No se pudo guardar la plantacion.')),
      }),
      finalize(() => this.formSaving.set(false)),
    );
  }

  // ── Zone CRUD ─────────────────────────────────────────────────────
  createZone(plantationId: number, request: CreateZoneRequest): Observable<Zone> {
    this.zoneSaving.set(true);
    this.zoneError.set('');
    return this.plantationService.createZone(plantationId, request).pipe(
      tap({
        error: (err: unknown) => this.zoneError.set(this.apiMessage(err, 'No se pudo guardar la zona.')),
      }),
      finalize(() => this.zoneSaving.set(false)),
    );
  }

  updateZone(plantationId: number, zoneId: number, request: UpdateZoneRequest): Observable<Zone> {
    this.zoneSaving.set(true);
    this.zoneError.set('');
    return this.plantationService.updateZone(plantationId, zoneId, request).pipe(
      tap({
        error: (err: unknown) => this.zoneError.set(this.apiMessage(err, 'No se pudo guardar la zona.')),
      }),
      finalize(() => this.zoneSaving.set(false)),
    );
  }

  // ── Write access ──────────────────────────────────────────────────
  loadWriteAccess(): void {
    this.accessLoading.set(true);
    this.accessError.set('');
    this.accessService
      .loadWriteAccess()
      .pipe(finalize(() => this.accessLoading.set(false)))
      .subscribe({
        next: (a) => this.access.set(a),
        error: () => this.accessError.set('No se pudo validar la suscripcion.'),
      });
  }

  // ── Inspections ───────────────────────────────────────────────────
  loadInspections(params?: { plantationId?: number; size?: number }): void {
    this.inspectionsLoading.set(true);
    this.inspectionsError.set('');
    if (!environment.features.inspections) {
      this.inspections.set([]);
      this.inspectionsLoading.set(false);
      this.inspectionsError.set(
        this.t.translate('ftm.error.inspectionsUnavailable'),
      );
      return;
    }
    this.inspectionService
      .list(params ?? { size: 50 })
      .pipe(finalize(() => this.inspectionsLoading.set(false)))
      .subscribe({
        next: (res) => this.inspections.set(res.inspections),
        error: () => this.inspectionsError.set(this.t.translate('ftm.error.loadInspections')),
      });
  }

  loadInspection(id: number): void {
    this.inspectionLoading.set(true);
    this.inspectionError.set('');
    if (!environment.features.inspections) {
      this.inspection.set(null);
      this.inspectionLoading.set(false);
      this.inspectionError.set(
        this.t.translate('ftm.error.inspectionsUnavailable'),
      );
      return;
    }
    this.inspectionService
      .getById(id)
      .pipe(finalize(() => this.inspectionLoading.set(false)))
      .subscribe({
        next: (i) => this.inspection.set(i),
        error: () => this.inspectionError.set('No se pudo cargar la inspeccion.'),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private toVm(p: Plantation): PlantationVm {
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      totalHectares: p.totalHectares,
      phenologicalPhase: p.phenologicalPhase,
      zonesCount: p.zonesCount ?? 0,
      devicesCount: p.devicesCount ?? 0,
      soilType: p.soilType,
      overallHealth: p.overallHealth ?? undefined,
      connectedDevices: 0,
      activeAlerts: 0,
    };
  }

  private apiMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? fallback;
    }
    return fallback;
  }
}
