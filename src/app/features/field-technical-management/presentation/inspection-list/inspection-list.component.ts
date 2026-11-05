import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { FieldInspection } from '../../domain/inspection.model';
import { InspectionService } from '../../infrastructure/inspection-api.service';

@Component({
  selector: 'app-inspection-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './inspection-list.component.html',
})
export class InspectionListComponent implements OnInit {
  private readonly inspectionService = inject(InspectionService);
  private readonly authService = inject(AuthService);

  readonly inspections = signal<FieldInspection[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

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
        error: () => this.error.set('No se pudieron cargar las inspecciones.'),
      });
  }
}
