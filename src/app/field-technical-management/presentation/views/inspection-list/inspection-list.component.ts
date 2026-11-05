import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { TranslationService } from '../../../../i18n/translation.service';
import { FieldInspection } from '../../../domain/model/inspection.entity';
import { InspectionService } from '../../../infrastructure/inspection-api.service';

@Component({
  selector: 'app-inspection-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './inspection-list.component.html',
})
export class InspectionListComponent implements OnInit {
  private readonly inspectionService = inject(InspectionService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  readonly inspections = signal<FieldInspection[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  // ── i18n getters ──

  get badgeLabel(): string {
    return this.isAgronomist()
      ? this.t.translate('insp.list.badge.agronomist')
      : this.t.translate('insp.list.badge.grower');
  }

  get headingText(): string {
    return this.t.translate('insp.list.heading');
  }

  get subtitleText(): string {
    return this.t.translate('insp.list.subtitle');
  }

  get counterLabel(): string {
    return this.t.translate('insp.list.counter');
  }

  get loadingText(): string {
    return this.t.translate('insp.list.loading');
  }

  get emptyTitle(): string {
    return this.t.translate('insp.list.empty');
  }

  get emptyDesc(): string {
    return this.t.translate('insp.list.emptyDesc');
  }

  get backDashboardLabel(): string { return this.t.translate('insp.list.backDashboard'); }
  get findingsLabel(): string { return this.t.translate('insp.list.findingsLabel'); }
  get observationsLabel(): string { return this.t.translate('insp.list.observationsLabel'); }
  get inspectionDateLabel(): string { return this.t.translate('insp.list.inspectionDateLabel'); }
  get agronomistFallbackLabel(): string { return this.t.translate('insp.list.agronomistFallback'); }
  get loadErrorLabel(): string { return this.t.translate('insp.list.error.load'); }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.inspectionService
      .list({ size: 50 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.inspections.set(response.inspections),
        error: () => this.error.set(this.loadErrorLabel),
      });
  }
}
