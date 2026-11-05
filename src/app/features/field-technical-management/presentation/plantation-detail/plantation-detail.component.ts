import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { AlertService } from '../../../alert-and-notification/infrastructure/alert-api.service';
import { Plantation } from '../../domain/plantation.model';
import { Zone } from '../../domain/zone.model';
import { Alert } from '../../../alert-and-notification/domain/alert.model';
import { PlantationService } from '../../infrastructure/plantation-api.service';

@Component({
  selector: 'app-plantation-detail',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './plantation-detail.component.html',
})
export class PlantationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly plantationService = inject(PlantationService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

  readonly plantation = signal<Plantation | null>(null);
  readonly zones = signal<Zone[]>([]);
  readonly activeAlerts = signal<Alert[]>([]);
  readonly loading = signal(false);
  readonly zonesLoading = signal(false);
  readonly error = signal('');

  readonly healthLabel: Record<string, string> = {
    optimal: 'Optimo',
    at_risk: 'En riesgo',
    critical: 'Critico',
  };

  readonly healthColor: Record<string, string> = {
    optimal: 'var(--color-success)',
    at_risk: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  readonly healthBg: Record<string, string> = {
    optimal: 'rgba(76,205,130,0.12)',
    at_risk: 'var(--color-warning-10)',
    critical: 'var(--color-danger-10)',
  };

  readonly zoneAlerts = computed(() => {
    const alerts = this.activeAlerts();
    const map = new Map<number, Alert[]>();
    for (const a of alerts) {
      const key = a.monitoringZoneId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  });

  readonly soilTypeLabel: Record<string, string> = {
    arcilloso_humedo: 'Arcilloso humedo',
    franco_arenoso: 'Franco arenoso',
    franco_arcilloso: 'Franco arcilloso',
    arenoso: 'Arenoso',
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id)) {
      this.load(id);
    } else {
      this.error.set('Plantacion no valida.');
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set('');

    this.plantationService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (plantation) => {
          this.plantation.set(plantation);
          this.loadZones(id);
          this.loadAlerts(id);
        },
        error: () => this.error.set('No se pudo cargar la plantacion.'),
      });
  }

  private loadZones(id: number): void {
    this.zonesLoading.set(true);
    this.plantationService
      .listZones(id)
      .pipe(finalize(() => this.zonesLoading.set(false)))
      .subscribe({
        next: (zones) => this.zones.set(zones),
      });
  }

  private loadAlerts(plantationId: number): void {
    this.alertService.list({ status: 'active', plantationId, size: 50 }).subscribe({
      next: (response) => this.activeAlerts.set(response.alerts),
    });
  }
}
