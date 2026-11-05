import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, interval, startWith, Subscription, switchMap } from 'rxjs';
import { getApiErrorMessage } from '../../../../shared/infrastructure/api-error-message';
import { Alert, AlertCount } from '../../domain/alert.model';
import { AlertService } from '../../infrastructure/alert-api.service';

@Component({
  selector: 'app-alert-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './alert-list.component.html',
})
export class AlertListComponent implements OnInit, OnDestroy {
  private readonly alertService = inject(AlertService);

  readonly alerts = signal<Alert[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(0);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly activeTab = signal<'active' | 'resolved'>('active');
  readonly badgeCount = signal<AlertCount | null>(null);

  private pollSubscription: Subscription | null = null;

  readonly severityLabel: Record<string, string> = {
    critical: 'Critica',
    warning: 'Advertencia',
    informative: 'Informativa',
  };

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

  readonly statusLabel: Record<string, string> = {
    active: 'Activa',
    resolved: 'Resuelta',
  };

  ngOnInit(): void {
    this.load();
    this.loadCount();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSubscription = interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.alertService.count()),
      )
      .subscribe({
        next: (count) => this.badgeCount.set(count),
      });
  }

  setTab(tab: 'active' | 'resolved'): void {
    this.activeTab.set(tab);
    this.load();
  }

  acknowledge(alert: Alert, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.saving.set(alert.id);
    this.actionError.set('');

    this.alertService
      .acknowledge(alert.id)
      .pipe(finalize(() => this.saving.set(0)))
      .subscribe({
        next: () => this.load(),
        error: (error: unknown) =>
          this.actionError.set(getApiErrorMessage(error, 'No se pudo confirmar la alerta.')),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.alertService
      .list({ status: this.activeTab() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.alerts.set(response.alerts),
        error: () => this.error.set('No se pudieron cargar las alertas.'),
      });
  }

  private loadCount(): void {
    this.alertService.count().subscribe({
      next: (count) => this.badgeCount.set(count),
    });
  }
}
