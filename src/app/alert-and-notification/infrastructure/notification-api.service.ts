import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationCount, NotificationListResponse } from '../domain/model/notification.entity';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  list(params?: { read?: boolean; page?: number; size?: number }): Observable<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params?.read !== undefined) query.set('read', String(params.read));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.toString().length ? `?${query.toString()}` : '';
    return this.http.get<NotificationListResponse>(`${this.api}${suffix}`);
  }

  count(): Observable<NotificationCount> {
    return this.http.get<NotificationCount>(`${this.api}/count`);
  }

  markAsRead(id: number): Observable<{ id: number; read: boolean; readAt: string }> {
    return this.http.put<{ id: number; read: boolean; readAt: string }>(`${this.api}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ updatedCount: number; message: string }> {
    return this.http.put<{ updatedCount: number; message: string }>(`${this.api}/read-all`, {});
  }
}
