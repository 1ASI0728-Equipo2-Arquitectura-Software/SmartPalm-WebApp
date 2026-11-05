import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { CropMonitoringDashboardStore } from '../../../application/crop-monitoring-dashboard.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly store = inject(CropMonitoringDashboardStore);
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);
  readonly features = environment.features;
  readonly sectorId = environment.demo.sectorId ?? 1;

  get headingText(): string {
    return this.t.translate('dashboard.heading.agronomist');
  }

  get subtitleText(): string {
    return this.t.translate('dashboard.subtitle.agronomist');
  }

  get loadingText(): string {
    return this.t.translate('dashboard.loading');
  }

  get refreshLabel(): string {
    return this.t.translate('dashboard.refresh');
  }

  get sectorChipLabel(): string {
    return this.t
      .translate('dashboard.context.sectorChip')
      .replace('{{id}}', String(this.sectorId));
  }

  get kpiPendingLabel(): string {
    return this.t.translate('dashboard.kpi.pendingRecs');
  }
  get kpiPublishedLabel(): string {
    return this.t.translate('dashboard.kpi.publishedRecs');
  }
  get kpiInterventionsLabel(): string {
    return this.t.translate('dashboard.kpi.interventions');
  }
  get kpiGatewaysLabel(): string {
    return this.t.translate('dashboard.kpi.gateways');
  }
  get kpiHealthLabel(): string {
    return this.t.translate('dashboard.kpi.sectorHealth');
  }

  get deviceSectionLabel(): string {
    return this.t.translate('dashboard.devices.agronomist');
  }
  get connectedLabel(): string {
    return this.t.translate('dashboard.devices.connected');
  }
  get disconnectedLabel(): string {
    return this.t.translate('dashboard.devices.disconnected');
  }
  get noGatewaysLabel(): string {
    return this.t.translate('dashboard.noGateways');
  }

  get trendsHeading(): string {
    return this.t.translate('dashboard.trends.heading');
  }
  get trendsSubtitle(): string {
    return this.t.translate('dashboard.trends.subtitle');
  }
  get trendsEmptyLabel(): string {
    return this.t.translate('dashboard.trends.empty');
  }
  get trendsInsufficientLabel(): string {
    return this.t.translate('dashboard.trends.insufficient');
  }

  samplesLabel(n: number): string {
    return this.t.translate('dashboard.trends.samples').replace('{{n}}', String(n));
  }

  trendLabel(trend: 'up' | 'down' | 'stable'): string {
    if (trend === 'up') return this.t.translate('dashboard.trend.up');
    if (trend === 'down') return this.t.translate('dashboard.trend.down');
    return this.t.translate('dashboard.trend.stable');
  }

  get healthSectionLabel(): string {
    return this.t.translate('dashboard.health.agronomist');
  }

  get readingsHeading(): string {
    return this.t.translate('dashboard.readings.agronomist');
  }
  get noRecentReadingsLabel(): string {
    return this.t.translate('dashboard.noRecentReadings');
  }

  get recommendationsHeading(): string {
    return this.t.translate('dashboard.recommendations');
  }
  get interventionsHeading(): string {
    return this.t.translate('dashboard.interventions');
  }
  get pendingQueueHeading(): string {
    return this.t.translate('dashboard.pendingQueue');
  }
  get viewAllLabel(): string {
    return this.t.translate('dashboard.viewAll');
  }
  get emptyPendingLabel(): string {
    return this.t.translate('dashboard.emptyPending');
  }
  get emptyPublishedLabel(): string {
    return this.t.translate('dashboard.emptyPublished');
  }
  get emptyInterventionsLabel(): string {
    return this.t.translate('dashboard.emptyInterventions');
  }

  get tableHeaderVariable(): string {
    return this.t.translate('dashboard.table.variable');
  }
  get tableHeaderValue(): string {
    return this.t.translate('dashboard.table.value');
  }
  get tableHeaderIotMac(): string {
    return this.t.translate('dashboard.table.iotMac');
  }
  get tableHeaderTime(): string {
    return this.t.translate('dashboard.table.time');
  }

  get quickMonitoring(): string {
    return this.t.translate('dashboard.quick.monitoring');
  }
  get quickMonitoringHint(): string {
    return this.t.translate('dashboard.quick.monitoringHint');
  }
  get quickRecommendations(): string {
    return this.t.translate('dashboard.quick.recommendations');
  }
  get quickRecommendationsHint(): string {
    return this.t.translate('dashboard.quick.recommendationsHint');
  }
  get quickInterventions(): string {
    return this.t.translate('dashboard.quick.interventions');
  }
  get quickInterventionsHint(): string {
    return this.t.translate('dashboard.quick.interventionsHint');
  }

  statusLabel(status: string): string {
    if (status === 'pending_review') return this.t.translate('dashboard.recStatus.pending');
    if (status === 'approved') return this.t.translate('dashboard.recStatus.approved');
    if (status === 'published') return this.t.translate('dashboard.recStatus.published');
    return status;
  }

  ngOnInit(): void {
    this.store.loadAll();
  }

  refresh(): void {
    this.store.loadAll();
  }

  navigateToMonitoring(): void {
    this.router.navigate(['/monitoreo']);
  }

  navigateToRecommendations(): void {
    this.router.navigate(['/recomendaciones']);
  }

  navigateToInterventions(): void {
    this.router.navigate(['/intervenciones']);
  }
}
