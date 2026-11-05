import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { Alert } from '../../../../alert-and-notification/domain/model/alert.entity';
import { FieldTechnicalManagementStore } from '../../../application/field-technical-management.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-plantation-detail',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './plantation-detail.component.html',
})
export class PlantationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(FieldTechnicalManagementStore);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');
  readonly features = environment.features;

  readonly plantation = this.store.plantation;
  readonly zones = this.store.zones;
  readonly activeAlerts = signal<Alert[]>([]);
  readonly loading = this.store.plantationLoading;
  readonly zonesLoading = this.store.zonesLoading;
  readonly error = this.store.plantationError;

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

  get backLabel(): string {
    return this.isAgronomist()
      ? this.t.translate('plant.detail.back.agronomist')
      : this.t.translate('plant.detail.back.grower');
  }

  get loadingText(): string { return this.t.translate('plant.detail.loading'); }

  healthLabel(status: string): string {
    if (status === 'critical') return this.t.translate('plant.detail.health.critical');
    if (status === 'at_risk') return this.t.translate('plant.detail.health.atRisk');
    return this.t.translate('plant.detail.health.optimal');
  }

  phaseLabel(phase: string): string {
    return phase === 'produccion'
      ? this.t.translate('plant.detail.phase.produccion')
      : this.t.translate('plant.detail.phase.establecimiento');
  }

  get zonesLabel(): string { return this.t.translate('plant.detail.zones'); }
  get devicesLabel(): string { return this.t.translate('plant.detail.devices'); }
  get alertsLabel(): string { return this.t.translate('plant.detail.alerts'); }
  get soilLabel(): string { return this.t.translate('plant.detail.soil'); }
  get ageLabel(): string { return this.t.translate('plant.detail.age'); }
  get updatedLabel(): string { return this.t.translate('plant.detail.updated'); }
  get editBtnLabel(): string { return this.t.translate('plant.detail.editBtn'); }
  get addZoneBtnLabel(): string { return this.t.translate('plant.detail.addZoneBtn'); }
  get monitoringZonesLabel(): string { return this.t.translate('plant.detail.monitoringZones'); }
  get zonesRegisteredLabel(): string { return this.t.translate('plant.detail.zonesRegistered'); }
  get loadingZonesText(): string { return this.t.translate('plant.detail.loadingZones'); }
  get noZonesTitle(): string { return this.t.translate('plant.detail.noZones'); }

  get noZonesDesc(): string {
    return this.isAgronomist()
      ? this.t.translate('plant.detail.noZonesDescAgronomist')
      : this.t.translate('plant.detail.noZonesDescGrower');
  }

  get createFirstZoneLabel(): string { return this.t.translate('plant.detail.createFirstZone'); }
  get supervisionNote(): string { return this.t.translate('plant.detail.supervisionNote'); }

  soilTypeLabel(key: string): string {
    const map: Record<string, string> = {
      arcilloso_humedo: this.t.translate('plant.detail.soilTypes.arcillosoHumedo'),
      franco_arenoso: this.t.translate('plant.detail.soilTypes.francoArenoso'),
      franco_arcilloso: this.t.translate('plant.detail.soilTypes.francoArcilloso'),
      arenoso: this.t.translate('plant.detail.soilTypes.arenoso'),
    };
    return map[key] ?? key;
  }

  zoneAlertLevelLabel(level: string): string {
    return level === 'critical'
      ? this.t.translate('plant.detail.health.zone.critical')
      : this.t.translate('plant.detail.health.zone.atRisk');
  }

  get noDescriptionLabel(): string { return this.t.translate('plant.detail.noDescription'); }
  get invalidPlantationError(): string { return this.t.translate('plant.detail.error.invalid'); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isNaN(id) && id > 0) {
      this.store.loadPlantation(id);
      this.store.loadPlantationZones(id);
      // Alerts API not available for agronomist on real backend
      this.activeAlerts.set([]);
    } else {
      this.store.plantationError.set(this.invalidPlantationError);
    }
  }
}
