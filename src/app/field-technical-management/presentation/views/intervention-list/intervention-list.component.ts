import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { TranslationService } from '../../../../i18n/translation.service';
import { RecommendationService } from '../../../../agronomic-recommendation/infrastructure/recommendation-api.service';
import { Recommendation } from '../../../../agronomic-recommendation/domain/model/recommendation.entity';
import {
  AgronomicInterventionDto,
  InterventionApiService,
} from '../../../infrastructure/intervention-api.service';

@Component({
  selector: 'app-intervention-list',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './intervention-list.component.html',
})
export class InterventionListComponent implements OnInit {
  private readonly api = inject(InterventionApiService);
  private readonly recApi = inject(RecommendationService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly sectorId = environment.demo.sectorId ?? 1;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly items = signal<AgronomicInterventionDto[]>([]);
  /** Published recommendations for originRecommendationId select. */
  readonly publishedRecs = signal<Recommendation[]>([]);
  readonly recsLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(5)]],
    performedBy: [
      this.auth.user()?.fullName || this.auth.user()?.email || '',
      [Validators.required, Validators.minLength(2)],
    ],
    executionDate: [this.defaultLocalDateTime(), Validators.required],
    originRecommendationId: ['' as string],
  });

  get title(): string {
    return this.t.translate('interv.heading');
  }
  get subtitle(): string {
    return this.t.translate('interv.subtitle');
  }
  get loadingLabel(): string {
    return this.t.translate('interv.loading');
  }
  get emptyLabel(): string {
    return this.t.translate('interv.empty');
  }
  get formTitle(): string {
    return this.t.translate('interv.formTitle');
  }
  get descLabel(): string {
    return this.t.translate('interv.description');
  }
  get byLabel(): string {
    return this.t.translate('interv.performedBy');
  }
  get dateLabel(): string {
    return this.t.translate('interv.executionDate');
  }
  get recIdLabel(): string {
    return this.t.translate('interv.originRecommendationId');
  }
  get recNoneLabel(): string {
    return this.t.translate('interv.recNone');
  }
  get recsLoadingLabel(): string {
    return this.t.translate('interv.recsLoading');
  }
  get recsEmptyLabel(): string {
    return this.t.translate('interv.recsEmpty');
  }
  get submitLabel(): string {
    return this.t.translate('interv.submit');
  }
  get savingLabel(): string {
    return this.t.translate('interv.saving');
  }
  get contextLabel(): string {
    return this.t
      .translate('interv.contextSector')
      .replace('{{id}}', String(this.sectorId));
  }
  get refreshLabel(): string {
    return this.t.translate('interv.refresh');
  }
  get listHeading(): string {
    return this.t.translate('interv.listHeading');
  }
  get openRecLabel(): string {
    return this.t.translate('interv.openRecommendation');
  }
  get backDashboardLabel(): string {
    return this.t.translate('interv.backDashboard');
  }
  get counterLabel(): string {
    return this.t.translate('interv.counter');
  }
  get publishedHint(): string {
    return this.t.translate('interv.publishedHint');
  }

  recommendationRef(id: number | null | undefined): string {
    if (!id) return '';
    return this.t.translate('interv.recommendationRef').replace('{{id}}', String(id));
  }

  recOptionLabel(rec: Recommendation): string {
    const title = (rec.title || rec.content || `#${rec.id}`).slice(0, 60);
    return `#${rec.id} — ${title}`;
  }

  ngOnInit(): void {
    this.reload();
  }

  /** datetime-local expects local wall time, not UTC ISO. */
  private defaultLocalDateTime(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  reload(): void {
    this.loading.set(true);
    this.recsLoading.set(true);
    this.error.set('');
    this.success.set('');

    forkJoin({
      items: this.api.listBySector(this.sectorId),
      published: this.recApi.list({
        scope: 'sector',
        sectorId: this.sectorId,
        status: 'Published',
      }),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.recsLoading.set(false);
        }),
      )
      .subscribe({
        next: ({ items, published }) => {
          // Newest first
          const rows = [...(items ?? [])].sort(
            (a, b) => new Date(b.executionDate).getTime() - new Date(a.executionDate).getTime(),
          );
          this.items.set(rows);
          this.publishedRecs.set(
            (published.recommendations ?? []).filter((r) => r.id > 0 && r.status === 'published'),
          );
        },
        error: (e) => this.error.set(getApiErrorMessage(e, this.t.translate('interv.error.load'))),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const recRaw = raw.originRecommendationId?.trim();
    const originRecommendationId = recRaw ? Number(recRaw) : null;
    const parsedDate = new Date(raw.executionDate);
    if (Number.isNaN(parsedDate.getTime())) {
      this.error.set(this.t.translate('interv.error.invalidDate'));
      return;
    }
    const description = raw.description.trim();
    const performedBy = raw.performedBy.trim();
    if (!description || !performedBy) {
      this.error.set(this.t.translate('interv.error.create'));
      return;
    }

    this.saving.set(true);
    this.success.set('');
    this.error.set('');
    this.api
      .create(this.sectorId, {
        description,
        performedBy,
        executionDate: parsedDate.toISOString(),
        originRecommendationId:
          originRecommendationId && Number.isFinite(originRecommendationId) && originRecommendationId > 0
            ? originRecommendationId
            : null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.success.set(this.t.translate('interv.created'));
          this.form.patchValue({
            description: '',
            originRecommendationId: '',
            executionDate: this.defaultLocalDateTime(),
          });
          this.reload();
        },
        error: (e) => this.error.set(getApiErrorMessage(e, this.t.translate('interv.error.create'))),
      });
  }
}
