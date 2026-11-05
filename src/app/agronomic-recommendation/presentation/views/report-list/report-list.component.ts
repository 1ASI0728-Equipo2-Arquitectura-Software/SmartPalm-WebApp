import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-report-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './report-list.component.html',
})
export class ReportListComponent implements OnInit {
  private readonly router = inject(Router);
  readonly store = inject(AgronomicRecommendationStore);
  private readonly t = inject(TranslationService);

  readonly activeTab = signal<'drafts' | 'published'>('published');

  // ── i18n getters/methods (runtime) ──

  get badgeLabel(): string {
    return this.store.isAgronomist()
      ? this.t.translate('report.list.badge.agronomist')
      : this.t.translate('report.list.badge.grower');
  }

  get headingText(): string {
    return this.t.translate('report.list.heading');
  }

  get subtitleText(): string {
    return this.store.isAgronomist()
      ? this.t.translate('report.list.subtitle.agronomist')
      : this.t.translate('report.list.subtitle.grower');
  }

  get counterLabel(): string { return this.t.translate('report.list.counter'); }
  get tabDraftsLabel(): string { return this.t.translate('report.list.tab.drafts'); }
  get tabPublishedLabel(): string { return this.t.translate('report.list.tab.published'); }
  get newReportLabel(): string { return this.t.translate('report.list.newReport'); }
  get generateBtnLabel(): string { return this.t.translate('report.list.generateBtn'); }
  get generatingLabel(): string { return this.t.translate('report.list.generating'); }
  get selectPlantationLabel(): string { return this.t.translate('report.list.selectPlantation'); }
  get loadingText(): string { return this.t.translate('report.list.loading'); }
  get emptyDraftsTitle(): string { return this.t.translate('report.list.emptyDrafts'); }
  get emptyDraftsDesc(): string { return this.t.translate('report.list.emptyDraftsDesc'); }
  get emptyPublishedTitle(): string { return this.t.translate('report.list.emptyPublished'); }
  get emptyPublishedDesc(): string { return this.t.translate('report.list.emptyPublishedDesc'); }
  get goToDraftsLabel(): string { return this.t.translate('report.list.goToDrafts'); }
  get backDashboardLabel(): string { return this.t.translate('report.list.backDashboard'); }
  get draftHelpText(): string { return this.t.translate('report.list.draftHelp'); }
  get agronomistNameFallback(): string { return this.t.translate('report.list.agronomistFallback'); }
  get reportDateLabel(): string { return this.t.translate('report.list.reportDate'); }

  statusLabel(status: string): string {
    return status === 'published'
      ? this.t.translate('report.list.status.published')
      : this.t.translate('report.list.status.draft');
  }

  ngOnInit(): void {
    this.load();
    if (this.store.isAgronomist()) {
      this.store.loadPlantationsForReports();
    }
  }

  selectTab(tab: 'drafts' | 'published'): void {
    this.activeTab.set(tab);
    this.load();
  }

  generateReport(plantationId: number): void {
    if (!plantationId) return;
    this.store.generateDraftReport(plantationId).subscribe({
      next: (report) => this.router.navigate(['/reportes', report.id]),
    });
  }

  private load(): void {
    const status = this.activeTab() === 'drafts' ? 'draft' : 'published';
    this.store.loadReports({ status, size: 50 });
  }
}
