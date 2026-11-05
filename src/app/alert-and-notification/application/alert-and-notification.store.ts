import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert, AlertCount } from '../domain/model/alert.entity';
import { Notification, NotificationCount } from '../domain/model/notification.entity';
import { AlertService } from '../infrastructure/alert-api.service';
import { NotificationService } from '../infrastructure/notification-api.service';

/**
 * Central state store for the Alert & Notification bounded context.
 *
 * Exposes readonly signals and orchestration methods so presentation views
 * consume pre-computed state without duplicating fetch/update logic.
 */
@Injectable({ providedIn: 'root' })
export class AlertAndNotificationStore {
  private readonly alertService = inject(AlertService);
  private readonly notificationService = inject(NotificationService);

  // ── Alert list state ──────────────────────────────────────────
  readonly alerts = signal<Alert[]>([]);
  readonly alertsLoading = signal(false);
  readonly alertsError = signal('');
  readonly activeTab = signal<'active' | 'resolved'>('active');
  readonly badgeCount = signal<AlertCount | null>(null);
  readonly acknowledgingId = signal(0);
  readonly acknowledgeError = signal('');

  // ── Alert detail state ────────────────────────────────────────
  readonly alert = signal<Alert | null>(null);
  readonly alertLoading = signal(false);
  readonly alertError = signal('');
  readonly alertSaving = signal(false);
  readonly alertActionError = signal('');
  readonly alertActionSuccess = signal('');

  // ── Notification state ────────────────────────────────────────
  readonly notifications = signal<Notification[]>([]);
  readonly notificationsLoading = signal(false);
  readonly notificationsError = signal('');
  readonly unreadCount = signal(0);

  // ── Alert list methods ────────────────────────────────────────

  loadAlerts(): void {
    this.alertsLoading.set(true);
    this.alertsError.set('');
    if (!environment.features.alerts) {
      this.alerts.set([]);
      this.alertsLoading.set(false);
      this.alertsError.set(
        $localize`:@@alert.error.unavailable:Las alertas no están disponibles en el backend real todavía.`,
      );
      return;
    }
    this.alertService
      .list({ status: this.activeTab() })
      .pipe(finalize(() => this.alertsLoading.set(false)))
      .subscribe({
        next: (res) => this.alerts.set(res.alerts),
        error: () => this.alertsError.set($localize`:@@alert.error.noAlerts:No se pudieron cargar las alertas.`),
      });
  }

  loadAlertCount(): void {
    if (!environment.features.alerts) {
      this.badgeCount.set({ total: 0, critical: 0, warning: 0, informative: 0, unacknowledged: 0 });
      return;
    }
    this.alertService.count().subscribe({
      next: (count) => this.badgeCount.set(count),
    });
  }

  setTab(tab: 'active' | 'resolved'): void {
    this.activeTab.set(tab);
    this.loadAlerts();
  }

  acknowledgeAlert(id: number): void {
    this.acknowledgingId.set(id);
    this.acknowledgeError.set('');
    this.alertService
      .acknowledge(id)
      .pipe(finalize(() => this.acknowledgingId.set(0)))
      .subscribe({
        next: () => this.loadAlerts(),
        error: () => this.acknowledgeError.set($localize`:@@alert.error.acknowledge:No se pudo confirmar la alerta.`),
      });
  }

  // ── Alert detail methods ──────────────────────────────────────

  loadAlert(id: number): void {
    this.alertLoading.set(true);
    this.alertError.set('');
    this.alertService
      .getById(id)
      .pipe(finalize(() => this.alertLoading.set(false)))
      .subscribe({
        next: (a) => this.alert.set(a),
        error: () => this.alertError.set($localize`:@@alert.error.noAlertDetail:No se pudo cargar la alerta.`),
      });
  }

  acknowledgeAlertDetail(): void {
    const current = this.alert();
    if (!current) return;
    this.alertSaving.set(true);
    this.alertActionError.set('');
    this.alertActionSuccess.set('');
    this.alertService
      .acknowledge(current.id)
      .pipe(finalize(() => this.alertSaving.set(false)))
      .subscribe({
        next: () => {
          this.alertActionSuccess.set('Recepcion confirmada correctamente.');
          this.loadAlert(current.id);
        },
        error: () => this.alertActionError.set($localize`:@@alert.error.acknowledge:No se pudo confirmar la alerta.`),
      });
  }

  // ── Notification methods ──────────────────────────────────────

  loadNotifications(params?: { read?: boolean; page?: number; size?: number }): void {
    this.notificationsLoading.set(true);
    this.notificationsError.set('');
    this.notificationService
      .list(params)
      .pipe(finalize(() => this.notificationsLoading.set(false)))
      .subscribe({
        next: (res) => this.notifications.set(res.notifications),
        error: () => this.notificationsError.set('No se pudieron cargar las notificaciones.'),
      });
  }

  loadNotificationCount(): void {
    this.notificationService.count().subscribe({
      next: (count) => this.unreadCount.set(count.unreadCount),
    });
  }

  markNotificationAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        this.loadNotificationCount();
      },
    });
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.loadNotificationCount();
      },
    });
  }
}
