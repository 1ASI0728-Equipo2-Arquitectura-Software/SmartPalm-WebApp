import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { PlantationService } from '../../../field-technical-management/infrastructure/plantation-api.service';
import { Plantation } from '../../../field-technical-management/domain/plantation.model';
import { Report } from '../../domain/report.model';
import { ReportService } from '../../infrastructure/report-api.service';

@Component({
  selector: 'app-report-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './report-list.component.html',
})
export class ReportListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly plantationService = inject(PlantationService);
  private readonly router = inject(Router);

  readonly reports = signal<Report[]>([]);
  readonly plantations = signal<Plantation[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly activeTab = signal<'drafts' | 'published'>('published');
  readonly generatingPlantationId = signal(0);

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

  ngOnInit(): void {
    this.load();
    if (this.isAgronomist()) {
      this.loadPlantations();
    }
  }

  selectTab(tab: 'drafts' | 'published'): void {
    this.activeTab.set(tab);
    this.load();
  }

  generateReport(plantationId: number): void {
    if (!plantationId) return;

    this.generatingPlantationId.set(plantationId);
    this.error.set('');

    this.reportService
      .generateDraft(plantationId)
      .pipe(finalize(() => this.generatingPlantationId.set(0)))
      .subscribe({
        next: (report) => this.router.navigate(['/reportes', report.id]),
        error: (err: unknown) => this.error.set(getApiErrorMessage(err, 'No se pudo generar el borrador.')),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    const status = this.activeTab() === 'drafts' ? 'draft' : 'published';

    this.reportService
      .list({ status, size: 50 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.reports.set(response.reports),
        error: () => this.error.set('No se pudieron cargar los reportes.'),
      });
  }

  private loadPlantations(): void {
    this.plantationService.list().subscribe({
      next: (plantations) => this.plantations.set(plantations),
    });
  }
}
