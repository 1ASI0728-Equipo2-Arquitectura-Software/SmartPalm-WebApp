import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationService } from '../../../../i18n/translation.service';
import { FieldInspection } from '../../../domain/model/inspection.entity';
import { InspectionService } from '../../../infrastructure/inspection-api.service';

@Component({
  selector: 'app-inspection-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './inspection-detail.component.html',
})
export class InspectionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly inspectionService = inject(InspectionService);
  private readonly t = inject(TranslationService);

  readonly inspection = signal<FieldInspection | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  // ── i18n getters ──

  get backLabel(): string {
    return this.t.translate('insp.detail.back');
  }

  get badgeLabel(): string {
    return this.t.translate('insp.detail.badge');
  }

  get loadingText(): string {
    return this.t.translate('insp.detail.loading');
  }

  get observationsLabel(): string {
    return this.t.translate('insp.detail.observations');
  }

  get findingsLabel(): string {
    return this.t.translate('insp.detail.findings');
  }

  get summaryLabel(): string {
    return this.t.translate('insp.detail.summary');
  }

  get interventionsLabel(): string {
    return this.t.translate('insp.detail.interventions');
  }

  get noInterventionsText(): string {
    return this.t.translate('insp.detail.noInterventions');
  }

  get executedByLabel(): string {
    return this.t.translate('insp.detail.executedBy');
  }

  get onLabel(): string {
    return this.t.translate('insp.detail.on');
  }

  get invalidInspectionText(): string {
    return this.t.translate('insp.detail.error.invalid');
  }

  get loadErrorText(): string {
    return this.t.translate('insp.detail.error.load');
  }

  get interventionResultLabel(): string {
    return this.t.translate('insp.detail.result');
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.error.set(this.invalidInspectionText);
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.inspectionService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (inspection) => this.inspection.set(inspection),
        error: () => this.error.set(this.loadErrorText),
      });
  }
}
