import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationCount,
  NotificationListResponse,
} from '../../alert-and-notification/domain/model/notification.entity';

/**
 * Notifications are not exposed by the real backend yet.
 * When features.notifications is false, methods short-circuit to empty results
 * so the agronomist shell does not spam 404s.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  list(params?: { read?: boolean; page?: number; size?: number }): Observable<NotificationListResponse> {
    if (!environment.features.notifications) {
      return of({ notifications: [], totalElements: 0, unreadCount: 0 });
    }
    const query = new URLSearchParams();
    if (params?.read !== undefined) query.set('read', String(params.read));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.toString().length ? `?${query.toString()}` : '';
    return this.http.get<NotificationListResponse>(`${this.api}${suffix}`);
  }

  count(): Observable<NotificationCount> {
    if (!environment.features.notifications) {
      return of({ unreadCount: 0 });
    }
    return this.http.get<NotificationCount>(`${this.api}/count`);
  }

  markAsRead(id: number): Observable<{ id: number; read: boolean; readAt: string }> {
    if (!environment.features.notifications) {
      return of({ id, read: true, readAt: new Date().toISOString() });
    }
    return this.http.put<{ id: number; read: boolean; readAt: string }>(`${this.api}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ updatedCount: number; message: string }> {
    if (!environment.features.notifications) {
      return of({ updatedCount: 0, message: 'Notifications disabled' });
    }
    return this.http.put<{ updatedCount: number; message: string }>(`${this.api}/read-all`, {});
  }
}
