import { Component, OnInit, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { FieldTechnicalManagementStore } from '../../../application/field-technical-management.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-plantation-list',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './plantation-list.component.html',
})
export class PlantationListComponent implements OnInit {
  private readonly store = inject(FieldTechnicalManagementStore);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  readonly plantations = this.store.plantations;
  readonly loading = this.store.plantationsLoading;
  readonly error = this.store.plantationsError;

  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');

  readonly healthDot: Record<string, string> = {
    optimal: 'var(--color-success)',
    at_risk: 'var(--color-warning)',
    critical: 'var(--color-danger)',
  };

  // ── i18n getters/methods (runtime) ──

  get badgeLabel(): string {
    return this.isAgronomist()
      ? this.t.translate('plant.list.badge.agronomist')
      : this.t.translate('plant.list.badge.grower');
  }

  get headingText(): string {
    return this.isAgronomist()
      ? this.t.translate('plant.list.heading.agronomist')
      : this.t.translate('plant.list.heading.grower');
  }

  get subtitleText(): string {
    return this.isAgronomist()
      ? this.t.translate('plant.list.subtitle.agronomist')
      : this.t.translate('plant.list.subtitle.grower');
  }

  get counterLabel(): string { return this.t.translate('plant.list.counter'); }
  get loadingText(): string { return this.t.translate('plant.list.loading'); }
  get emptyTitle(): string { return this.t.translate('plant.list.empty'); }
  get emptyDesc(): string { return this.t.translate('plant.list.emptyDesc'); }
  get createFirstLabel(): string { return this.t.translate('plant.list.createFirst'); }
  get createNewLabel(): string { return this.t.translate('plant.list.createNew'); }
  get backDashboardLabel(): string { return this.t.translate('plant.list.backDashboard'); }
  get hectaresShortLabel(): string { return this.t.translate('plant.list.hectaresShort'); }
  get zonesLabel(): string { return this.t.translate('plant.list.zones'); }
  get devicesLabel(): string { return this.t.translate('plant.list.devices'); }
  get soilLabel(): string { return this.t.translate('plant.list.soil'); }
  get loadErrorLabel(): string { return this.t.translate('plant.list.error.load'); }
  get demoNote(): string { return this.t.translate('plant.list.demoNote'); }
  get notAvailableLabel(): string { return this.t.translate('common.notAvailable'); }

  phaseLabel(phase: string): string {
    return phase === 'produccion'
      ? this.t.translate('plant.list.phase.produccion')
      : this.t.translate('plant.list.phase.establecimiento');
  }

  healthLabel(status: string): string {
    if (status === 'critical') return this.t.translate('plant.list.health.critical');
    if (status === 'at_risk') return this.t.translate('plant.list.health.atRisk');
    return this.t.translate('plant.list.health.optimal');
  }

  soilTypeLabel(value: string): string {
    if (!value || value === '—' || value === '-') return 'Sin dato';
    const normalizedKey = this.normalizeSoilTypeKey(value);
    const translationKey = `plant.list.soilTypes.${normalizedKey}`;
    const translated = this.t.translate(translationKey);
    return translated === translationKey ? this.formatSoilType(value) : translated;
  }

  private normalizeSoilTypeKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  private formatSoilType(value: string): string {
    return value
      .replace(/_/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  ngOnInit(): void {
    this.store.loadPlantations();
  }
}
