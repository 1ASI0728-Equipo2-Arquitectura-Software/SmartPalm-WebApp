import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { Alert } from '../../domain/alert.model';
import { AlertService } from '../../infrastructure/alert-api.service';

@Component({
  selector: 'app-alert-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './alert-detail.component.html',
})
export class AlertDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);

  readonly alert = signal<Alert | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly actionSuccess = signal('');

  readonly severityLabel: Record<string, string> = {
    critical: 'Critica',
    warning: 'Advertencia',
    informative: 'Informativa',
  };

  readonly severityColor: Record<string, string> = {
    critical: 'var(--color-danger)',
    warning: '#f59e0b',
    informative: 'var(--color-accent-cyan)',
  };

  readonly severityBg: Record<string, string> = {
    critical: 'var(--color-danger-10)',
    warning: '#fef3c7',
    informative: 'var(--color-bg-soft-cyan)',
  };

  readonly variableUnit: Record<string, string> = {
    temperature: '°C',
    soil_humidity: '%',
    soil_ph: '',
  };

  readonly variableLabel: Record<string, string> = {
    temperature: 'Temperatura',
    soil_humidity: 'Humedad del suelo',
    soil_ph: 'pH del suelo',
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.actionError.set('Alerta no valida.');
    }
  }

  acknowledge(): void {
    const current = this.alert();
    if (!current) return;

    this.saving.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    this.alertService
      .acknowledge(current.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.actionSuccess.set('Recepcion confirmada correctamente.');
          this.load(current.id);
        },
        error: (error: unknown) =>
          this.actionError.set(getApiErrorMessage(error, 'No se pudo confirmar la alerta.')),
      });
  }

  computeBarPosition(alert: Alert) {
    const margin = (alert.thresholdMax - alert.thresholdMin) * 0.25 || 1;
    const totalMin = alert.thresholdMin - margin;
    const totalMax = alert.thresholdMax + margin;
    const totalRange = totalMax - totalMin;
    if (totalRange <= 0) return null;

    const left = `${(((alert.triggeredValue - totalMin) / totalRange) * 96).toFixed(1)}%`;
    const rangeStart = `${(((alert.thresholdMin - totalMin) / totalRange) * 100).toFixed(1)}%`;
    const rangeWidth = `${(((alert.thresholdMax - alert.thresholdMin) / totalRange) * 100).toFixed(1)}%`;
    const color =
      alert.alertLevel === 'critical'
        ? 'var(--color-danger)'
        : alert.alertLevel === 'warning'
          ? '#f59e0b'
          : 'var(--color-accent-cyan)';

    return { left, rangeStart, rangeWidth, color };
  }

  private load(id: number): void {
    this.loading.set(true);

    this.alertService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (alert) => this.alert.set(alert),
        error: () => this.actionError.set('No se pudo cargar la alerta.'),
      });
  }
}
