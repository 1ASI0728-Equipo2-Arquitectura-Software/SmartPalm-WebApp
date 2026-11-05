import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FieldInspection } from '../../domain/inspection.model';
import { InspectionService } from '../../infrastructure/inspection-api.service';

@Component({
  selector: 'app-inspection-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './inspection-detail.component.html',
})
export class InspectionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly inspectionService = inject(InspectionService);

  readonly inspection = signal<FieldInspection | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.error.set('Inspeccion no valida.');
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
        error: () => this.error.set('No se pudo cargar la inspeccion.'),
      });
  }
}
