import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateDeviceRequest, Device, DeviceConfigurationRequest } from '../domain/model/device.entity';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/devices`;

  list(params?: { plantationId?: number; status?: 'active' | 'inactive' }): Observable<Device[]> {
    const query = new URLSearchParams();
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.status) query.set('status', params.status);
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<Device[]>(`${this.api}${suffix}`);
  }

  getById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.api}/${id}`);
  }

  create(request: CreateDeviceRequest): Observable<Device> {
    return this.http.post<Device>(this.api, request);
  }

  updateConfiguration(id: number, request: DeviceConfigurationRequest): Observable<Device> {
    return this.http.put<Device>(`${this.api}/${id}/configuration`, request);
  }

  deactivate(id: number): Observable<{ id: number; activationStatus: string; connectivityStatus: string; deactivatedAt: string; message: string }> {
    return this.http.put<{ id: number; activationStatus: string; connectivityStatus: string; deactivatedAt: string; message: string }>(
      `${this.api}/${id}/deactivate`,
      {},
    );
  }

  activate(id: number): Observable<{ id: number; activationStatus: string; connectivityStatus: string; activatedAt: string }> {
    return this.http.put<{ id: number; activationStatus: string; connectivityStatus: string; activatedAt: string }>(
      `${this.api}/${id}/activate`,
      {},
    );
  }

  reassignZone(id: number, monitoringZoneId: number): Observable<{ id: number; monitoringZoneId: number; zoneName: string; updatedAt: string }> {
    return this.http.put<{ id: number; monitoringZoneId: number; zoneName: string; updatedAt: string }>(
      `${this.api}/${id}/zone`,
      { monitoringZoneId },
    );
  }
}
