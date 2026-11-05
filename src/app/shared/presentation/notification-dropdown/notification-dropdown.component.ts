import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, interval, startWith, Subscription, switchMap } from 'rxjs';
import { getApiErrorMessage } from '../../infrastructure/api-error-message';
import { Notification } from '../../../alert-and-notification/domain/model/notification.entity';
import { NotificationService } from '../../infrastructure/notification.service';
import { TranslationService } from '../../../i18n/translation.service';
import { environment } from '../../../../environments/environment';

const DEEP_LINK_MAP: Record<string, string> = {
  alert: '/alertas',
  device: '/dispositivos',
  recommendation: '/recomendaciones',
  report: '/reportes',
};

@Component({
  selector: 'app-notification-dropdown',
  imports: [DatePipe],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly open = signal(false);
  readonly actionError = signal('');
  /** Notifications BC is off in agronomist desk; hide UI noise. */
  readonly enabled = environment.features.notifications;

  private pollSubscription: Subscription | null = null;

  get headerLabel(): string { return this.t.translate('notifications.header'); }
  get emptyLabel(): string { return this.t.translate('notifications.empty'); }
  get markReadLabel(): string { return this.t.translate('notifications.markRead'); }
  get markAllReadLabel(): string { return this.t.translate('notifications.markAllRead'); }

  ngOnInit(): void {
    if (!this.enabled) return;
    this.loadNotifications();
    this.loadCount();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationService.count()),
      )
      .subscribe({
        next: (count) => this.unreadCount.set(count.unreadCount),
      });
  }

  toggle(): void {
    this.open.set(!this.open());
    if (this.open()) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.read) return;

    this.actionError.set('');

    this.notificationService
      .markAsRead(notification.id)
      .pipe(finalize(() => this.loadCount()))
      .subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
          );
        },
        error: (error: unknown) =>
          this.actionError.set(
            getApiErrorMessage(error, this.t.translate('notifications.markError')),
          ),
      });
  }

  markAllAsRead(): void {
    this.actionError.set('');

    this.notificationService
      .markAllAsRead()
      .pipe(finalize(() => this.loadCount()))
      .subscribe({
        next: () => {
          this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        },
        error: (error: unknown) =>
          this.actionError.set(
            getApiErrorMessage(error, this.t.translate('notifications.markAllError')),
          ),
      });
  }

  navigateToResource(notification: Notification): void {
    const baseRoute = DEEP_LINK_MAP[notification.relatedResourceType];
    if (!baseRoute) return;

    const route = ['report'].includes(notification.relatedResourceType)
      ? baseRoute
      : `${baseRoute}/${notification.relatedResourceId}`;

    this.router.navigate([route]);
    this.open.set(false);
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.actionError.set('');

    this.notificationService
      .list({ size: 10 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.notifications.set(response.notifications),
        error: (error: unknown) =>
          this.actionError.set(
            getApiErrorMessage(error, this.t.translate('notifications.loadError')),
          ),
      });
  }

  private loadCount(): void {
    this.notificationService.count().subscribe({
      next: (count) => this.unreadCount.set(count.unreadCount),
    });
  }
}
