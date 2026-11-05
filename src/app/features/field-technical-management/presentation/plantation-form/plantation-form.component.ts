import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Bc01AccessService } from '../../infrastructure/bc01-access.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { PlantationService } from '../../infrastructure/plantation-api.service';
import { CreatePlantationRequest, Plantation } from '../../domain/plantation.model';

@Component({
  selector: 'app-plantation-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './plantation-form.component.html',
})
export class PlantationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plantationService = inject(PlantationService);
  private readonly accessService = inject(Bc01AccessService);

  readonly soilTypes = ['arcilloso_humedo', 'franco_arenoso', 'franco_arcilloso', 'arenoso'];
  readonly phenologicalPhases = ['produccion', 'establecimiento'] as const;

  readonly loading = signal(false);
  readonly accessLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly isEditMode = signal(false);
  readonly plantationId = signal<number | null>(null);
  readonly canWrite = signal(false);
  readonly accessMessage = signal('');
  readonly hectareLimitReached = signal(false);
  readonly planName = signal('');
  readonly usedHectares = signal(0);
  readonly maxHectares = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    location: ['', [Validators.required]],
    totalHectares: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
    soilType: ['arcilloso_humedo', [Validators.required]],
    cropAge: ['', [Validators.required]],
    phenologicalPhase: ['produccion' as 'produccion' | 'establecimiento', [Validators.required]],
    latitude: [0],
    longitude: [0],
  });

  ngOnInit(): void {
    this.loadWriteAccess();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.isEditMode.set(true);
      this.plantationId.set(id);
      this.loadPlantation(id);
    }
  }

  get title(): string {
    return this.isEditMode() ? 'Editar plantacion' : 'Nueva plantacion';
  }

  get submitLabel(): string {
    if (this.saving()) {
      return this.isEditMode() ? 'Guardando...' : 'Creando...';
    }
    return this.isEditMode() ? 'Guardar cambios' : 'Crear plantacion';
  }

  get formDisabled(): boolean {
    if (!this.canWrite()) return true;
    if (!this.isEditMode() && this.hectareLimitReached()) return true;
    return false;
  }

  get hectareLimitMessage(): string {
    return `Ya usaste todas las hectareas de tu plan ${this.planName()} (${this.usedHectares()}/${this.maxHectares()}). No puedes registrar mas plantaciones. Considera actualizar tu plan.`;
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

    const payload: CreatePlantationRequest = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');

    const request$ = this.isEditMode() && this.plantationId() !== null
      ? this.plantationService.update(this.plantationId()!, payload)
      : this.plantationService.create(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (plantation) => this.router.navigate(['/plantaciones', plantation.id]),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo guardar la plantacion.')),
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
        this.hectareLimitReached.set(access.hectareLimitReached);
        this.planName.set(access.planName);
        this.usedHectares.set(access.usedHectares);
        this.maxHectares.set(access.maxHectares);
      });
  }

  private loadPlantation(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.plantationService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (plantation) => this.patchForm(plantation),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error, 'No se pudo cargar la plantacion.')),
      });
  }

  private patchForm(plantation: Plantation): void {
    this.form.patchValue({
      name: plantation.name,
      location: plantation.location,
      totalHectares: plantation.totalHectares,
      soilType: plantation.soilType,
      cropAge: plantation.cropAge,
      phenologicalPhase: plantation.phenologicalPhase,
      latitude: plantation.latitude ?? 0,
      longitude: plantation.longitude ?? 0,
    });
  }

}
