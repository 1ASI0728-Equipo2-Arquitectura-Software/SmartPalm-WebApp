import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertAndNotificationStore } from '../../../application/alert-and-notification.store';
import { Alert } from '../../../domain/model/alert.entity';

@Component({
  selector: 'app-alert-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './alert-detail.component.html',
})
export class AlertDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AlertAndNotificationStore);

  readonly alert = this.store.alert;
  readonly loading = this.store.alertLoading;
  readonly saving = this.store.alertSaving;
  readonly actionError = this.store.alertActionError;
  readonly actionSuccess = this.store.alertActionSuccess;

  // ── i18n getters ────────────────────────────────────────────

  get severityLabel(): Record<string, string> {
    return {
      critical: $localize`:@@alert.severity.critical:Critica`,
      warning: $localize`:@@alert.severity.warning:Advertencia`,
      informative: $localize`:@@alert.severity.informative:Informativa`,
    };
  }

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

  get variableUnit(): Record<string, string> {
    return { temperature: '°C', soil_humidity: '%', soil_ph: '' };
  }

  get variableLabel(): Record<string, string> {
    return {
      temperature: $localize`:@@alert.variable.temperature:Temperatura`,
      soil_humidity: $localize`:@@alert.variable.soilHumidity:Humedad del suelo`,
      soil_ph: $localize`:@@alert.variable.soilPh:pH del suelo`,
    };
  }

  get backLabel(): string {
    return $localize`:@@alert.detail.back:← Volver a alertas`;
  }

  get loadingText(): string {
    return $localize`:@@alert.detail.loading:Cargando detalle...`;
  }

  get measurementLabel(): string {
    return $localize`:@@alert.detail.measurement:Medicion`;
  }

  get expectedRangeLabel(): string {
    return $localize`:@@alert.detail.expectedRange:Rango esperado`;
  }

  get currentLabel(): string {
    return $localize`:@@alert.detail.current:Actual:`;
  }

  get plantationLabel(): string {
    return $localize`:@@alert.detail.plantation:Plantacion`;
  }

  get zoneLabel(): string {
    return $localize`:@@alert.detail.zone:Zona`;
  }

  get variableFieldLabel(): string {
    return $localize`:@@alert.detail.variable:Variable`;
  }

  get deviceLabel(): string {
    return $localize`:@@alert.detail.device:Dispositivo`;
  }

  get registeredLabel(): string {
    return $localize`:@@alert.detail.registered:Registrada`;
  }

  get confirmedOnLabel(): string {
    return $localize`:@@alert.detail.confirmedOn:Confirmada el`;
  }

  get statusActiveLabel(): string {
    return $localize`:@@alert.detail.status.active:Activa`;
  }

  get statusResolvedLabel(): string {
    return $localize`:@@alert.detail.status.resolved:Resuelta`;
  }

  get statusConfirmedLabel(): string {
    return $localize`:@@alert.detail.status.confirmed:Confirmada`;
  }

  get acknowledgeButtonLabel(): string {
    return $localize`:@@alert.list.button.acknowledge:Confirmar recepcion`;
  }

  get acknowledgingButtonLabel(): string {
    return $localize`:@@alert.list.button.acknowledging:Confirmando...`;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.store.loadAlert(id);
    } else {
      this.store.alertActionError.set($localize`:@@alert.error.invalid:Alerta no valida.`);
    }
  }

  acknowledge(): void {
    this.store.acknowledgeAlertDetail();
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
}
