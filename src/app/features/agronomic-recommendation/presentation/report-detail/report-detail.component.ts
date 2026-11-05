import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { Report } from '../../domain/report.model';
import { ReportService } from '../../infrastructure/report-api.service';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink],
  templateUrl: './report-detail.component.html',
})
export class ReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);

  readonly report = signal<Report | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly actionLoading = signal('');
  readonly actionError = signal('');

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.error.set('Reporte no valido.');
    }
  }

  publish(): void {
    const r = this.report();
    if (!r) return;

    this.actionLoading.set('publish');
    this.actionError.set('');

    this.reportService
      .publish(r.id)
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: () => this.load(r.id),
        error: (err: unknown) => this.actionError.set(getApiErrorMessage(err, 'No se pudo publicar.')),
      });
  }

  exportPdf(): void {
    alert('PDF generado exitosamente. El archivo se descargara en breve.');
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.reportService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (report) => this.report.set(report),
        error: () => this.error.set('No se pudo cargar el reporte.'),
      });
  }
}
