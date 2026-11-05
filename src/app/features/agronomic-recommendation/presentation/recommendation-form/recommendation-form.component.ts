import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { RecommendationService } from '../../infrastructure/recommendation-api.service';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { AlertService } from '../../../alert-and-notification/infrastructure/alert-api.service';
import { Plantation } from '../../../field-technical-management/domain/plantation.model';
import { Zone } from '../../../field-technical-management/domain/zone.model';
import { Alert } from '../../../alert-and-notification/domain/alert.model';

@Component({
  selector: 'app-recommendation-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recommendation-form.component.html',
})
export class RecommendationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly recommendationService = inject(RecommendationService);
  private readonly plantationService = inject(PlantationService);
  private readonly alertService = inject(AlertService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly zonesLoading = signal(false);
  readonly alertsLoading = signal(false);
  readonly error = signal('');
  readonly plantations = signal<Plantation[]>([]);
  readonly zones = signal<Zone[]>([]);
  readonly activeAlerts = signal<Alert[]>([]);

  readonly form = this.fb.nonNullable.group({
    plantationId: [0, [Validators.required, Validators.min(1)]],
    monitoringZoneId: [0, [Validators.required, Validators.min(1)]],
    alertId: [0],
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    recommendedAction: ['', [Validators.required]],
    priority: ['medium' as 'low' | 'medium' | 'high' | 'critical', [Validators.required]],
  });

  private aiUsed = false;

  ngOnInit(): void {
    this.loadPlantations();
    this.form.controls.plantationId.valueChanges.subscribe((id) => {
      if (id > 0) {
        this.loadZonesAndAlerts(id);
      } else {
        this.zones.set([]);
        this.activeAlerts.set([]);
        this.form.controls.monitoringZoneId.setValue(0);
        this.form.controls.alertId.setValue(0);
      }
    });
  }

  generateWithAI(): void {
    const alertId = this.form.controls.alertId.value;
    if (alertId > 0) {
      const alert = this.activeAlerts().find((a) => a.id === alertId);
      if (alert) {
        this.form.patchValue({
          title: `${alert.title} — Recomendacion`,
          description: `Tras analizar la alerta "${alert.title}" en ${alert.zoneName}, se recomienda tomar acciones correctivas para normalizar el parametro ${alert.label} que actualmente registra ${alert.triggeredValue} (rango esperado: ${alert.thresholdMin} - ${alert.thresholdMax}).`,
          recommendedAction: `Revisar ${alert.label} en ${alert.zoneName} y aplicar medidas correctivas segun protocolo agronomico.`,
          priority: alert.alertLevel === 'critical' ? 'critical' : alert.alertLevel === 'warning' ? 'high' : 'medium',
        });
        this.aiUsed = true;
        return;
      }
    }
    const zone = this.zones().find((z) => z.id === this.form.controls.monitoringZoneId.value);
    if (zone) {
      this.form.patchValue({
        title: `Monitoreo programado — ${zone.name}`,
        description: `Se recomienda realizar una inspeccion de rutina en ${zone.name} para evaluar el estado general del cultivo, verificando parametros de suelo, humedad y sanidad vegetal.`,
        recommendedAction: `Programar visita de inspeccion a ${zone.name} en los proximos 7 dias.`,
      });
      this.aiUsed = true;
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      plantationId: raw.plantationId,
      monitoringZoneId: raw.monitoringZoneId,
      alertId: raw.alertId > 0 ? raw.alertId : null,
      title: raw.title,
      description: raw.description,
      recommendedAction: raw.recommendedAction,
      priority: raw.priority,
      generatedBy: this.aiUsed ? 'ai' as const : 'manual' as const,
    };

    this.saving.set(true);
    this.error.set('');

    this.recommendationService
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (rec) => this.router.navigate(['/recomendaciones', rec.id]),
        error: (err: unknown) => this.error.set(getApiErrorMessage(err, 'No se pudo crear la recomendacion.')),
      });
  }

  private loadPlantations(): void {
    this.loading.set(true);
    this.plantationService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (plantations) => this.plantations.set(plantations),
        error: (err: unknown) => this.error.set(getApiErrorMessage(err, 'No se pudieron cargar las plantaciones.')),
      });
  }

  private loadZonesAndAlerts(plantationId: number): void {
    this.zonesLoading.set(true);
    this.alertsLoading.set(true);

    this.plantationService
      .listZones(plantationId)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          if (!zones.some((z) => z.id === this.form.controls.monitoringZoneId.value)) {
            this.form.controls.monitoringZoneId.setValue(0);
          }
        },
        error: (err: unknown) => this.error.set(getApiErrorMessage(err, 'No se pudieron cargar las zonas.')),
      });

    this.alertService
      .list({ status: 'active', plantationId, size: 50 })
      .pipe(finalize(() => this.alertsLoading.set(false)))
      .subscribe({
        next: (response) => this.activeAlerts.set(response.alerts),
      });
  }
}
