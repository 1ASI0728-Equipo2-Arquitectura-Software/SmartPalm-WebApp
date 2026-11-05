import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConnectivityStatus {
  mac: string;
  isConnected: boolean;
  status: string;
}

export interface GatewayDevices {
  gatewayMac: string;
  devices: { deviceMac: string }[];
}

export interface AgronomicThreshold {
  edgeMac: string;
  iotMac: string;
  min: number;
  max: number;
  description: string;
  type: string;
}

export interface UpdateThresholdRequest {
  type: string;
  min?: number;
  max?: number;
  description?: string;
}

/** GET /sectors/{id}/health */
export interface SectorHealthDto {
  sectorId: number;
  /** 0 Healthy | 1 Warning | 2 Critical */
  status: number;
  sensorDetails: {
    sensorType: string;
    value: number;
    minThreshold: number;
    maxThreshold: number;
    isExceeded: boolean;
  }[];
}

/** Backend SensorTypes for thresholds / readings. */
export const SENSOR_TYPES = [
  'Temperature',
  'Humidity',
  'PH',
  'Luminosity',
  'SoilMoisture',
] as const;

export type SensorTypeName = (typeof SENSOR_TYPES)[number];

/**
 * Edge gateways + agronomic thresholds + sector health (SensorData + IoT BCs).
 */
@Injectable({ providedIn: 'root' })
export class EdgeGatewayService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/edge-gateways`;

  listGateways(): Observable<ConnectivityStatus[]> {
    if (!environment.features.iotStatus) return of([]);
    return this.http.get<ConnectivityStatus[]>(this.base);
  }

  getDevices(gatewayMac: string): Observable<GatewayDevices> {
    return this.http.get<GatewayDevices>(
      `${this.base}/${encodeURIComponent(gatewayMac)}/devices`,
    );
  }

  getConnectivity(gatewayMac: string): Observable<ConnectivityStatus> {
    return this.http.get<ConnectivityStatus>(
      `${this.base}/${encodeURIComponent(gatewayMac)}/connectivity`,
    );
  }

  listThresholds(deviceMac: string = environment.demo.deviceMac): Observable<AgronomicThreshold[]> {
    if (!environment.features.sensors) return of([]);
    return this.http.get<AgronomicThreshold[]>(
      `${environment.apiUrl}/devices/${encodeURIComponent(deviceMac)}/thresholds`,
    );
  }

  updateThreshold(
    body: UpdateThresholdRequest,
    deviceMac: string = environment.demo.deviceMac,
  ): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}/devices/${encodeURIComponent(deviceMac)}/thresholds`,
      body,
    );
  }

  getSectorHealth(sectorId: number): Observable<SectorHealthDto> {
    return this.http.get<SectorHealthDto>(`${environment.apiUrl}/sectors/${sectorId}/health`);
  }
}
