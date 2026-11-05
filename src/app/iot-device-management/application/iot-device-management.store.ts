import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { Device, CreateDeviceRequest, DeviceConfigurationRequest } from '../domain/model/device.entity';
import { DeviceService } from '../infrastructure/device-api.service';
import { PlantationService } from '../../field-technical-management/infrastructure/field-technical-management-api';
import { Plantation } from '../../field-technical-management/domain/model/plantation.entity';
import { Zone } from '../../field-technical-management/domain/model/zone.entity';
import { Bc01AccessService } from '../../field-technical-management/infrastructure/field-technical-management-api';
import type { Bc01WriteAccess } from '../../field-technical-management/infrastructure/field-technical-management-api';

export type { Device, CreateDeviceRequest, DeviceConfigurationRequest };

/**
 * Central state store for the IoT Device Management bounded context.
 *
 * Exposes readonly signals and orchestration methods so presentation views
 * consume pre‑computed state without duplicating fetch/update logic.
 */
@Injectable({ providedIn: 'root' })
export class IotDeviceManagementStore {
  private readonly deviceService = inject(DeviceService);
  private readonly plantationService = inject(PlantationService);
  private readonly accessService = inject(Bc01AccessService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  // ── Device list state ────────────────────────────────────────────
  readonly devices = signal<Device[]>([]);
  readonly devicesLoading = signal(false);
  readonly devicesError = signal('');

  // ── Device detail state ──────────────────────────────────────────
  readonly device = signal<Device | null>(null);
  readonly deviceLoading = signal(false);
  readonly deviceError = signal('');

  // ── Plantation helper state (for forms) ──────────────────────────
  readonly plantations = signal<Plantation[]>([]);
  readonly plantationsLoading = signal(false);
  readonly plantationsError = signal('');

  // ── Zone helper state (for a given plantation) ───────────────────
  readonly zones = signal<Zone[]>([]);
  readonly zonesLoading = signal(false);
  readonly zonesError = signal('');

  // ── Device form state ────────────────────────────────────────────
  readonly formSaving = signal(false);
  readonly formError = signal('');

  // ── Device detail action state ───────────────────────────────────
  readonly actionLoading = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');

  // ── Write‑access state (subscription‑gated) ──────────────────────
  readonly access = signal<Bc01WriteAccess | null>(null);
  readonly accessLoading = signal(false);
  readonly accessError = signal('');

  // ── Computed ──────────────────────────────────────────────────────
  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  readonly canWrite = computed(() => this.access()?.canWrite ?? false);
  readonly accessMessage = computed(() => this.access()?.message ?? '');

  // ── Device list ───────────────────────────────────────────────────
  loadDevices(params?: { plantationId?: number; status?: 'active' | 'inactive' }): void {
    this.devicesLoading.set(true);
    this.devicesError.set('');
    this.deviceService
      .list(params)
      .pipe(finalize(() => this.devicesLoading.set(false)))
      .subscribe({
        next: (devices) => this.devices.set(devices),
        error: () => this.devicesError.set(this.t.translate('device.list.error.load')),
      });
  }

  // ── Device detail ─────────────────────────────────────────────────
  loadDevice(id: number): void {
    this.deviceLoading.set(true);
    this.deviceError.set('');
    this.actionError.set('');
    this.actionSuccess.set('');
    this.deviceService
      .getById(id)
      .pipe(finalize(() => this.deviceLoading.set(false)))
      .subscribe({
        next: (device) => this.device.set(device),
        error: (err: unknown) =>
          this.deviceError.set(this.apiMessage(err, this.t.translate('device.error.loadDevice'))),
      });
  }

  // ── Plantation helpers ────────────────────────────────────────────
  loadPlantations(): void {
    this.plantationsLoading.set(true);
    this.plantationsError.set('');
    this.plantationService
      .list()
      .pipe(finalize(() => this.plantationsLoading.set(false)))
      .subscribe({
        next: (plantations) => this.plantations.set(plantations),
        error: (err: unknown) =>
          this.plantationsError.set(this.apiMessage(err, this.t.translate('device.error.loadPlantations'))),
      });
  }

  loadZones(plantationId: number): void {
    this.zonesLoading.set(true);
    this.zonesError.set('');
    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (zones) => this.zones.set(zones),
        error: (err: unknown) =>
          this.zonesError.set(this.apiMessage(err, this.t.translate('device.error.loadZones'))),
      });
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
        error: () => this.accessError.set(this.t.translate('device.error.validateSubscription')),
      });
  }

  // ── Device CRUD ───────────────────────────────────────────────────
  createDevice(request: CreateDeviceRequest): Observable<Device> {
    this.formSaving.set(true);
    this.formError.set('');
    return this.deviceService.create(request).pipe(
      tap({
        error: (err: unknown) =>
          this.formError.set(this.apiMessage(err, this.t.translate('device.error.register'))),
      }),
      finalize(() => this.formSaving.set(false)),
    );
  }

  updateConfiguration(id: number, request: DeviceConfigurationRequest): Observable<Device> {
    this.actionLoading.set('config');
    this.actionError.set('');
    this.actionSuccess.set('');
    return this.deviceService.updateConfiguration(id, request).pipe(
      tap({
        error: (err: unknown) =>
          this.actionError.set(this.apiMessage(err, this.t.translate('device.error.updateConfig'))),
      }),
      finalize(() => this.actionLoading.set('')),
    );
  }

  activate(id: number): Observable<{ id: number; activationStatus: string; connectivityStatus: string; activatedAt: string }> {
    this.actionLoading.set('activate');
    this.actionError.set('');
    this.actionSuccess.set('');
    return this.deviceService.activate(id).pipe(
      tap({
        error: (err: unknown) =>
          this.actionError.set(this.apiMessage(err, this.t.translate('device.error.updateStatus'))),
      }),
      finalize(() => this.actionLoading.set('')),
    );
  }

  deactivate(id: number): Observable<{ id: number; activationStatus: string; connectivityStatus: string; deactivatedAt: string; message: string }> {
    this.actionLoading.set('deactivate');
    this.actionError.set('');
    this.actionSuccess.set('');
    return this.deviceService.deactivate(id).pipe(
      tap({
        error: (err: unknown) =>
          this.actionError.set(this.apiMessage(err, this.t.translate('device.error.updateStatus'))),
      }),
      finalize(() => this.actionLoading.set('')),
    );
  }

  reassignZone(id: number, monitoringZoneId: number): Observable<{ id: number; monitoringZoneId: number; zoneName: string; updatedAt: string }> {
    this.actionLoading.set('zone');
    this.actionError.set('');
    this.actionSuccess.set('');
    return this.deviceService.reassignZone(id, monitoringZoneId).pipe(
      tap({
        error: (err: unknown) =>
          this.actionError.set(this.apiMessage(err, this.t.translate('device.error.reassignZone'))),
      }),
      finalize(() => this.actionLoading.set('')),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private apiMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? fallback;
    }
    return fallback;
  }
}
