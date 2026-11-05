import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Bc01AccessService } from '../../../infrastructure/bc01-access.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { PlantationService } from '../../../infrastructure/plantation-api.service';
import { CreatePlantationRequest, Plantation } from '../../../domain/model/plantation.entity';
import { TranslationService } from '../../../../i18n/translation.service';

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
  private readonly t = inject(TranslationService);

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

  get backLabel(): string {
    return this.isEditMode()
      ? this.t.translate('plant.form.backDetail')
      : this.t.translate('plant.form.backList');
  }

  get loadingText(): string { return this.t.translate('plant.form.loading'); }

  get title(): string {
    return this.isEditMode()
      ? this.t.translate('plant.form.titleEdit')
      : this.t.translate('plant.form.titleNew');
  }

  get subtitleText(): string { return this.t.translate('plant.form.subtitle'); }
  get nameLabel(): string { return this.t.translate('plant.form.name'); }
  get locationLabel(): string { return this.t.translate('plant.form.location'); }
  get totalHectaresLabel(): string { return this.t.translate('plant.form.totalHectares'); }
  get soilTypeLabel(): string { return this.t.translate('plant.form.soilType'); }
  get cropAgeLabel(): string { return this.t.translate('plant.form.cropAge'); }
  get cropAgePlaceholder(): string { return this.t.translate('plant.form.cropAgePlaceholder'); }
  get phenologicalPhaseLabel(): string { return this.t.translate('plant.form.phenologicalPhase'); }
  get latitudeLabel(): string { return this.t.translate('plant.form.latitude'); }
  get longitudeLabel(): string { return this.t.translate('plant.form.longitude'); }
  get cancelLabel(): string { return this.t.translate('plant.form.cancel'); }

  get submitLabel(): string {
    if (this.saving()) {
      return this.isEditMode()
        ? this.t.translate('plant.form.saving')
        : this.t.translate('plant.form.creating');
    }
    return this.isEditMode()
      ? this.t.translate('plant.form.submitSave')
      : this.t.translate('plant.form.submitCreate');
  }

  get formDisabled(): boolean {
    if (!this.canWrite()) return true;
    if (!this.isEditMode() && this.hectareLimitReached()) return true;
    return false;
  }

  get hectareLimitMessage(): string {
    return this.t
      .translate('plant.form.hectareLimit')
      .replace('{plan}', this.planName())
      .replace('{used}', String(this.usedHectares()))
      .replace('{max}', String(this.maxHectares()));
  }

  soilTypeLabelFor(value: string): string {
    const key = `plant.form.soilTypes.${value}`;
    const translated = this.t.translate(key);
    return translated === key ? value : translated;
  }

  phaseLabelFor(value: string): string {
    const key = `plant.form.phase.${value}`;
    const translated = this.t.translate(key);
    return translated === key ? value : translated;
  }

  save(): void {
    if (!this.canWrite()) {
      this.error.set(this.accessMessage() || this.t.translate('plant.form.needSubscription'));
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
        error: (error: unknown) =>
          this.error.set(getApiErrorMessage(error, this.t.translate('plant.form.errorSave'))),
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
        error: (error: unknown) =>
          this.error.set(getApiErrorMessage(error, this.t.translate('plant.form.errorLoad'))),
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
