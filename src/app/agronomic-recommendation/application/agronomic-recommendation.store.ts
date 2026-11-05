import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error-message';
import {
  Recommendation,
  CreateRecommendationRequest,
  RecommendationScope,
} from '../domain/model/recommendation.entity';
import { Report } from '../domain/model/report.entity';
import { RecommendationService } from '../infrastructure/recommendation-api.service';
import { ReportService } from '../infrastructure/report-api.service';
import { Plantation } from '../../field-technical-management/domain/model/plantation.entity';

/**
 * Central state store for the Agronomic Recommendation bounded context.
 */
@Injectable({ providedIn: 'root' })
export class AgronomicRecommendationStore {
  private readonly recommendationService = inject(RecommendationService);
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  // ── Recommendation list state ─────────────────────────────────────
  readonly recommendations = signal<Recommendation[]>([]);
  readonly recommendationsLoading = signal(false);
  readonly recommendationsError = signal('');
  /** Active list scope: sector (default) or general. */
  readonly listScope = signal<RecommendationScope>('sector');
  readonly listSectorId = signal(environment.demo.sectorId ?? 1);

  // ── Recommendation detail state ───────────────────────────────────
  readonly recommendationDetail = signal<Recommendation | null>(null);
  readonly recommendationDetailLoading = signal(false);
  readonly recommendationDetailError = signal('');
  readonly recommendationActionLoading = signal('');
  readonly recommendationActionError = signal('');
  readonly recommendationActionSuccess = signal('');

  // ── Recommendation form state ─────────────────────────────────────
  readonly recommendationFormLoading = signal(false);
  readonly recommendationFormSaving = signal(false);
  readonly recommendationFormError = signal('');
  readonly formSectorId = signal(environment.demo.sectorId ?? 1);

  // ── Report list state (feature-flagged off) ───────────────────────
  readonly reports = signal<Report[]>([]);
  readonly reportsLoading = signal(false);
  readonly reportsError = signal('');
  readonly reportGeneratingPlantationId = signal(0);
  readonly reportPlantations = signal<Plantation[]>([]);

  // ── Report detail state ────────────────────────────────────────────
  readonly reportDetail = signal<Report | null>(null);
  readonly reportDetailLoading = signal(false);
  readonly reportDetailError = signal('');
  readonly reportActionLoading = signal('');
  readonly reportActionError = signal('');

  // ── Computed ──────────────────────────────────────────────────────
  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  // ═══════════════════════════════════════════════════════════════════
  //  Recommendation list
  // ═══════════════════════════════════════════════════════════════════

  loadRecommendations(params?: {
    status?: string;
    sectorId?: number;
    scope?: RecommendationScope;
    size?: number;
  }): void {
    this.recommendationsLoading.set(true);
    this.recommendationsError.set('');
    const scope = params?.scope ?? this.listScope();
    const sectorId = params?.sectorId ?? this.listSectorId();
    this.listScope.set(scope);
    this.listSectorId.set(sectorId);

    this.recommendationService
      .list({ status: params?.status, sectorId, scope, size: params?.size })
      .pipe(finalize(() => this.recommendationsLoading.set(false)))
      .subscribe({
        next: (res) => this.recommendations.set(res.recommendations),
        error: (err: unknown) =>
          this.recommendationsError.set(
            getApiErrorMessage(err, this.t.translate('rec.error.load')),
          ),
      });
  }

  setListScope(scope: RecommendationScope): void {
    this.listScope.set(scope);
    this.loadRecommendations({ scope, sectorId: this.listSectorId() });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Recommendation detail
  // ═══════════════════════════════════════════════════════════════════

  loadRecommendationDetail(id: number): void {
    this.recommendationDetailLoading.set(true);
    this.recommendationDetailError.set('');
    this.recommendationDetail.set(null);
    this.recommendationActionError.set('');
    this.recommendationActionSuccess.set('');

    if (!id) {
      this.recommendationDetailLoading.set(false);
      this.recommendationDetailError.set(this.t.translate('rec.error.noId'));
      return;
    }

    this.recommendationService
      .getById(id)
      .pipe(finalize(() => this.recommendationDetailLoading.set(false)))
      .subscribe({
        next: (rec) => this.recommendationDetail.set(rec),
        error: (err: unknown) =>
          this.recommendationDetailError.set(
            getApiErrorMessage(err, this.t.translate('rec.error.loadDetail')),
          ),
      });
  }

  approveRecommendation(id: number): Observable<Recommendation> {
    this.recommendationActionLoading.set('approve');
    this.recommendationActionError.set('');
    this.recommendationActionSuccess.set('');
    return this.recommendationService.approve(id).pipe(
      tap({
        next: (rec) => {
          this.recommendationDetail.set(rec);
          this.recommendationActionSuccess.set(this.t.translate('rec.action.approved'));
        },
        error: (err: unknown) =>
          this.recommendationActionError.set(
            getApiErrorMessage(err, this.t.translate('rec.error.approve')),
          ),
      }),
      finalize(() => this.recommendationActionLoading.set('')),
    );
  }

  publishRecommendation(id: number): Observable<Recommendation> {
    this.recommendationActionLoading.set('publish');
    this.recommendationActionError.set('');
    this.recommendationActionSuccess.set('');
    return this.recommendationService.publish(id).pipe(
      tap({
        next: (rec) => {
          this.recommendationDetail.set(rec);
          this.recommendationActionSuccess.set(this.t.translate('rec.action.published'));
        },
        error: (err: unknown) =>
          this.recommendationActionError.set(
            getApiErrorMessage(err, this.t.translate('rec.error.publish')),
          ),
      }),
      finalize(() => this.recommendationActionLoading.set('')),
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Recommendation form
  // ═══════════════════════════════════════════════════════════════════

  prepareForm(): void {
    this.recommendationFormLoading.set(false);
    this.recommendationFormError.set('');
    this.formSectorId.set(environment.demo.sectorId ?? 1);
  }

  createRecommendation(request: CreateRecommendationRequest): Observable<Recommendation> {
    this.recommendationFormSaving.set(true);
    this.recommendationFormError.set('');
    const payload: CreateRecommendationRequest = {
      ...request,
      sectorId:
        request.scope === 'general'
          ? null
          : request.sectorId || this.formSectorId() || environment.demo.sectorId || 1,
      agronomistId: request.agronomistId || this.authService.user()?.id || environment.demo.agronomistId,
    };
    return this.recommendationService.create(payload).pipe(
      tap({
        error: (err: unknown) =>
          this.recommendationFormError.set(
            getApiErrorMessage(err, this.t.translate('rec.error.create')),
          ),
      }),
      finalize(() => this.recommendationFormSaving.set(false)),
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Reports (disabled in agronomist path — keep stubs for report views)
  // ═══════════════════════════════════════════════════════════════════

  loadReports(_params?: { status?: string; plantationId?: number; size?: number }): void {
    if (!environment.features.reports) {
      this.reports.set([]);
      this.reportsLoading.set(false);
      this.reportsError.set(this.t.translate('report.error.unavailable'));
      return;
    }
    this.reportsLoading.set(true);
    this.reportsError.set('');
    this.reportService
      .list(_params)
      .pipe(finalize(() => this.reportsLoading.set(false)))
      .subscribe({
        next: (res) => this.reports.set(res.reports),
        error: () => this.reportsError.set(this.t.translate('report.error.load')),
      });
  }

  loadPlantationsForReports(): void {
    this.reportPlantations.set([]);
  }

  generateDraftReport(plantationId: number): Observable<Report> {
    if (!environment.features.reports) {
      this.reportsError.set(this.t.translate('report.error.unavailable'));
      return new Observable<Report>((sub) => {
        sub.error(new Error('Reports feature disabled'));
      });
    }
    this.reportGeneratingPlantationId.set(plantationId);
    this.reportsError.set('');
    return this.reportService.generateDraft(plantationId).pipe(
      tap({
        error: (err: unknown) =>
          this.reportsError.set(getApiErrorMessage(err, 'No se pudo generar el borrador.')),
      }),
      finalize(() => this.reportGeneratingPlantationId.set(0)),
    );
  }

  loadReportDetail(id: number): void {
    if (!environment.features.reports) {
      this.reportDetail.set(null);
      this.reportDetailLoading.set(false);
      this.reportDetailError.set(this.t.translate('report.error.unavailable'));
      return;
    }
    this.reportDetailLoading.set(true);
    this.reportDetailError.set('');
    this.reportDetail.set(null);
    this.reportService
      .getById(id)
      .pipe(finalize(() => this.reportDetailLoading.set(false)))
      .subscribe({
        next: (report) => this.reportDetail.set(report),
        error: () => this.reportDetailError.set('No se pudo cargar el reporte.'),
      });
  }

  publishReport(id: number): Observable<Report> {
    if (!environment.features.reports) {
      this.reportActionError.set(this.t.translate('report.error.unavailable'));
      return new Observable<Report>((sub) => {
        sub.error(new Error('Reports feature disabled'));
      });
    }
    this.reportActionLoading.set('publish');
    this.reportActionError.set('');
    return this.reportService.publish(id).pipe(
      tap({
        error: (err: unknown) =>
          this.reportActionError.set(getApiErrorMessage(err, 'No se pudo publicar.')),
      }),
      finalize(() => this.reportActionLoading.set('')),
    );
  }
}
