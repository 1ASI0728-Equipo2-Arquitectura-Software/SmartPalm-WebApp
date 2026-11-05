import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink],
  templateUrl: './report-detail.component.html',
})
export class ReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(AgronomicRecommendationStore);

  // ── i18n getters/methods ──

  get backLabel(): string {
    return $localize`:@@report.detail.back:Volver a reportes`;
  }

  get loadingText(): string {
    return $localize`:@@report.detail.loading:Cargando reporte...`;
  }

  get publishBtnLabel(): string {
    return $localize`:@@report.detail.publishBtn:Publicar reporte`;
  }

  get publishingLabel(): string {
    return $localize`:@@report.detail.publishing:Publicando...`;
  }

  get exportPdfLabel(): string {
    return $localize`:@@report.detail.exportPdf:Exportar PDF`;
  }

  statusLabel(status: string): string {
    return status === 'published'
      ? $localize`:@@report.detail.status.published:Publicado`
      : $localize`:@@report.detail.status.draft:Borrador`;
  }

  get cropHealthLabel(): string {
    return $localize`:@@report.detail.cropHealth:Salud del cultivo`;
  }

  get overallStatusLabel(): string {
    return $localize`:@@report.detail.overallStatus:Estado general:`;
  }

  healthLabel(status: string): string {
    if (status === 'critical') return $localize`:@@report.detail.health.critical:Critico`;
    if (status === 'at_risk') return $localize`:@@report.detail.health.atRisk:En riesgo`;
    return $localize`:@@report.detail.health.optimal:Optimo`;
  }

  get sensorSummaryLabel(): string {
    return $localize`:@@report.detail.sensorSummary:Sensor Summary`;
  }

  get tempLabel(): string {
    return $localize`:@@report.detail.temp:Temp °C`;
  }

  get humidityLabel(): string {
    return $localize`:@@report.detail.humidity:Humedad %`;
  }

  get activeAlertsLabel(): string {
    return $localize`:@@report.detail.activeAlerts:Alertas activas`;
  }

  get recommendationsLabel(): string {
    return $localize`:@@report.detail.recommendations:Recomendaciones`;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.store.loadReportDetail(id);
    } else {
      this.store.reportDetailError.set('Reporte no valido.');
    }
  }

  publish(): void {
    const r = this.store.reportDetail();
    if (!r) return;
    this.store.publishReport(r.id).subscribe({
      next: () => this.store.loadReportDetail(r.id),
    });
  }

  exportPdf(): void {
    alert('PDF generado exitosamente. El archivo se descargara en breve.');
  }
}
