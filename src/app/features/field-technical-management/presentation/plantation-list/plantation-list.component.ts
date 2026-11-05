import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { Plantation } from '../../domain/plantation.model';
import { PlantationService } from '../../infrastructure/plantation-api.service';

interface PlantationVm {
  id: number;
  name: string;
  location: string;
  totalHectares: number;
  phenologicalPhase: string;
  zonesCount: number;
  devicesCount: number;
  soilType: string;
  overallHealth?: 'optimal' | 'at_risk' | 'critical' | null;
  connectedDevices?: number;
  activeAlerts?: number;
}

@Component({
  selector: 'app-plantation-list',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './plantation-list.component.html',
})
export class PlantationListComponent implements OnInit {
  private readonly plantationService = inject(PlantationService);
  private readonly authService = inject(AuthService);

  readonly plantations = signal<PlantationVm[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly isAgronomist = this.authService.currentUser?.role === 'agronomist';

  readonly healthDot: Record<string, string> = {
    optimal: 'var(--color-success)',
    at_risk: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  readonly healthLabel: Record<string, string> = {
    optimal: 'Optimo',
    at_risk: 'En riesgo',
    critical: 'Critico',
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.plantationService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (raw) => this.plantations.set(raw.map((p) => this.toVm(p))),
        error: () => this.error.set('No se pudieron cargar las plantaciones.'),
      });
  }

  private toVm(p: Plantation): PlantationVm {
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      totalHectares: p.totalHectares,
      phenologicalPhase: p.phenologicalPhase,
      zonesCount: p.zonesCount ?? 0,
      devicesCount: p.devicesCount ?? 0,
      soilType: p.soilType,
      overallHealth: p.overallHealth ?? undefined,
      connectedDevices: 0,
      activeAlerts: 0,
    };
  }
}
