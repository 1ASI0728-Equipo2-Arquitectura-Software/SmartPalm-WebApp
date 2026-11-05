import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { Bc01AccessService } from '../../infrastructure/bc01-access.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { Plantation } from '../../domain/plantation.model';
import { Zone } from '../../domain/zone.model';
import { PlantationService } from '../../infrastructure/plantation-api.service';

@Component({
  selector: 'app-zone-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './zone-form.component.html',
})
export class ZoneFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plantationService = inject(PlantationService);
  private readonly accessService = inject(Bc01AccessService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly accessLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly plantation = signal<Plantation | null>(null);
  readonly zones = signal<Zone[]>([]);
  readonly currentZone = signal<Zone | null>(null);
  readonly plantationId = signal<number | null>(null);
  readonly zoneId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly canWrite = signal(false);
  readonly accessMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    hectares: [1, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  readonly usedHectares = computed(() => {
    const currentZoneId = this.zoneId();
    return this.zones()
      .filter((zone) => zone.id !== currentZoneId)
      .reduce((sum, zone) => sum + zone.hectares, 0);
  });

  readonly availableHectares = computed(() => {
    const plantation = this.plantation();
    if (!plantation) return 0;
    return plantation.totalHectares - this.usedHectares();
  });

  ngOnInit(): void {
    if (this.authService.currentUser?.role === 'agronomist') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadWriteAccess();
    const plantationId = Number(this.route.snapshot.paramMap.get('plantationId'));
    const zoneId = Number(this.route.snapshot.paramMap.get('zoneId'));

    if (Number.isNaN(plantationId)) {
      this.error.set('Plantacion no valida.');
      return;
    }

    this.plantationId.set(plantationId);
    if (!Number.isNaN(zoneId)) {
      this.zoneId.set(zoneId);
      this.isEditMode.set(true);
    }

    this.loadContext(plantationId, this.zoneId());
  }

  get title(): string {
    return this.isEditMode() ? 'Editar zona' : 'Nueva zona';
  }

  get submitLabel(): string {
    if (this.saving()) {
      return this.isEditMode() ? 'Guardando...' : 'Creando...';
    }
    return this.isEditMode() ? 'Guardar cambios' : 'Crear zona';
  }

  save(): void {
    if (!this.canWrite()) {
      this.error.set(this.accessMessage() || 'Necesitas una suscripcion activa para continuar.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    if (payload.hectares > this.availableHectares()) {
      this.error.set(`Solo tienes ${this.availableHectares()} ha disponibles para esta zona.`);
      return;
    }

    const plantationId = this.plantationId();
    if (plantationId === null) return;

    this.saving.set(true);
    this.error.set('');

    const request$ = this.isEditMode() && this.zoneId() !== null
      ? this.plantationService.updateZone(plantationId, this.zoneId()!, payload)
      : this.plantationService.createZone(plantationId, payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/plantaciones', plantationId]),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo guardar la zona.')),
      });
  }

  private loadWriteAccess(): void {
    this.accessLoading.set(true);
    this.accessService
      .loadWriteAccess()
      .pipe(finalize(() => this.accessLoading.set(false)))
      .subscribe((access) => {
        this.canWrite.set(access.canWrite);
        this.accessMessage.set(access.message);
      });
  }

  private loadContext(plantationId: number, zoneId: number | null): void {
    this.loading.set(true);
    this.error.set('');

    this.plantationService
      .getById(plantationId)
      .subscribe({
        next: (plantation) => this.plantation.set(plantation),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo cargar la plantacion.')),
      });

    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          if (zoneId !== null) {
            const zone = zones.find((item) => item.id === zoneId) ?? null;
            this.currentZone.set(zone);
            if (zone) {
              this.form.patchValue({
                name: zone.name,
                hectares: zone.hectares,
                description: zone.description,
              });
            }
        }
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudieron cargar las zonas.')),
      });
  }
}
