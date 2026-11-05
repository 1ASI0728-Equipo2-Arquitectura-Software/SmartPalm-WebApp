import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval, startWith, Subscription, switchMap } from 'rxjs';
import { AlertAndNotificationStore } from '../../../application/alert-and-notification.store';
import { Alert, AlertCount } from '../../../domain/model/alert.entity';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-alert-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './alert-list.component.html',
})
export class AlertListComponent implements OnInit, OnDestroy {
  private readonly store = inject(AlertAndNotificationStore);
  private readonly t = inject(TranslationService);

  readonly alerts = this.store.alerts;
  readonly loading = this.store.alertsLoading;
  readonly saving = this.store.acknowledgingId;
  readonly error = this.store.alertsError;
  readonly actionError = this.store.acknowledgeError;
  readonly activeTab = this.store.activeTab;
  readonly badgeCount = this.store.badgeCount;

  private pollSubscription: Subscription | null = null;

  // ── i18n getters (runtime) ────────────────────────────────────────────

  private readonly _severityLabel = computed(() => ({
    critical: this.t.translate('alert.severity.critical'),
    warning: this.t.translate('alert.severity.warning'),
    informative: this.t.translate('alert.severity.informative'),
  }));

  get severityLabel(): Record<string, string> {
    return this._severityLabel();
  }

  readonly severityColor: Record<string, string> = {
    critical: 'var(--color-danger)',
    warning: '#f59e0b',
    informative: 'var(--color-accent-cyan)',
  };

  readonly severityBg: Record<string, string> = {
    critical: 'var(--color-danger-10)',
    warning: '#fef3c7',
    informative: 'var(--color-bg-soft-cyan)',
  };

  readonly severityBorder: Record<string, string> = {
    critical: 'var(--color-danger)',
    warning: '#f59e0b',
    informative: 'var(--color-border-subtle)',
  };

  get sectionLabel(): string { return this.t.translate('alert.section.management'); }
  get headingSubtitle(): string { return this.t.translate('alert.list.heading.subtitle'); }
  get badgeActiveLabel(): string { return this.t.translate('alert.list.badge.active'); }
  get badgeCriticalLabel(): string { return this.t.translate('alert.list.badge.critical'); }
  get badgeUnacknowledgedLabel(): string { return this.t.translate('alert.list.badge.unacknowledged'); }
  get tabActiveLabel(): string { return this.t.translate('alert.list.tab.active'); }
  get tabResolvedLabel(): string { return this.t.translate('alert.list.tab.resolved'); }
  get loadingText(): string { return this.t.translate('alert.list.loading'); }
  get emptyActiveTitle(): string { return this.t.translate('alert.list.emptyActive'); }
  get emptyActiveDesc(): string { return this.t.translate('alert.list.emptyActiveDesc'); }
  get emptyResolvedTitle(): string { return this.t.translate('alert.list.emptyResolved'); }
  get emptyResolvedDesc(): string { return this.t.translate('alert.list.emptyResolvedDesc'); }
  get statusConfirmedLabel(): string { return this.t.translate('alert.list.status.confirmed'); }
  get statusPendingLabel(): string { return this.t.translate('alert.list.status.pending'); }
  get statusResolvedLabel(): string { return this.t.translate('alert.list.status.resolved'); }
  get acknowledgeButtonLabel(): string { return this.t.translate('alert.list.button.acknowledge'); }
  get acknowledgingButtonLabel(): string { return this.t.translate('alert.list.button.acknowledging'); }
  get valueLabel(): string { return this.t.translate('alert.list.value.label'); }
  get rangeLabel(): string { return this.t.translate('alert.list.range.label'); }

  ngOnInit(): void {
    this.store.loadAlerts();
    this.store.loadAlertCount();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSubscription = interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.store.loadAlertCount();
          return [];
        }),
      )
      .subscribe();
  }

  setTab(tab: 'active' | 'resolved'): void {
    this.store.setTab(tab);
  }

  acknowledge(alert: Alert, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.acknowledgeAlert(alert.id);
  }
}
