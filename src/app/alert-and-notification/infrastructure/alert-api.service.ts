import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert, AlertCount, AlertListResponse } from '../domain/model/alert.entity';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/alerts`;

  list(params?: {
    status?: 'active' | 'resolved';
    plantationId?: number;
    level?: 'critical' | 'warning' | 'informative';
    page?: number;
    size?: number;
  }): Observable<AlertListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.level) query.set('level', params.level);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.toString().length ? `?${query.toString()}` : '';
    return this.http.get<AlertListResponse>(`${this.api}${suffix}`);
  }

  getById(id: number): Observable<Alert> {
    return this.http.get<Alert>(`${this.api}/${id}`);
  }

  count(): Observable<AlertCount> {
    return this.http.get<AlertCount>(`${this.api}/count`);
  }

  acknowledge(id: number): Observable<{ id: number; acknowledged: boolean; acknowledgedAt: string }> {
    return this.http.put<{ id: number; acknowledged: boolean; acknowledgedAt: string }>(
      `${this.api}/${id}/acknowledge`,
      {},
    );
  }
}
