import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SensorReading, SensorReadingsResponse } from '../domain/sensor-reading.model';

/** Backend SensorReadingViewResource (docs SensorDataProcessing). */
export interface SensorReadingBackendDto {
  edgeDeviceMacAddress: string;
  iotDeviceMacAddress: string;
  sensorType: string;
  value: number;
  unit: string | null;
  measuredAt: string;
}

const SENSOR_MAP: Record<
  string,
  { variableType: SensorReading['variableType']; labelKey: string; unit: string }
> = {
  Humidity: { variableType: 'soil_humidity', labelKey: 'Humidity', unit: '%' },
  PH: { variableType: 'soil_ph', labelKey: 'PH', unit: '' },
  Luminosity: { variableType: 'luminosity', labelKey: 'Luminosity', unit: 'lux' },
  Temperature: { variableType: 'temperature', labelKey: 'Temperature', unit: '°C' },
  SoilMoisture: { variableType: 'soil_moisture', labelKey: 'SoilMoisture', unit: '%' },
};

@Injectable({ providedIn: 'root' })
export class SensorReadingService {
  private readonly http = inject(HttpClient);

  /** GET /api/v1/devices/{deviceMac}/sensor-readings */
  list(params?: {
    deviceId?: number;
    plantationId?: number;
    monitoringZoneId?: number;
    variableType?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
    deviceMac?: string;
  }): Observable<SensorReadingsResponse> {
    if (!environment.features.sensors) {
      return of({ readings: [], totalElements: 0, totalPages: 0, page: 1, size: params?.size ?? 0 });
    }

    const deviceMac = params?.deviceMac ?? environment.demo.deviceMac;
    return this.http
      .get<SensorReadingBackendDto[]>(
        `${environment.apiUrl}/devices/${encodeURIComponent(deviceMac)}/sensor-readings${this.query(params)}`,
      )
      .pipe(map((items) => this.toResponse(items, params)));
  }

  /** GET /api/v1/edge-gateways/{gatewayMac}/sensor-readings */
  listByGateway(
    gatewayMac: string,
    params?: { from?: string; to?: string; page?: number; size?: number; deviceMac?: string },
  ): Observable<SensorReadingsResponse> {
    if (!environment.features.sensors) {
      return of({ readings: [], totalElements: 0, totalPages: 0, page: 1, size: params?.size ?? 0 });
    }
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    if (params?.deviceMac) query.set('deviceMac', params.deviceMac);
    const suffix = query.size ? `?${query.toString()}` : '';

    return this.http
      .get<SensorReadingBackendDto[]>(
        `${environment.apiUrl}/edge-gateways/${encodeURIComponent(gatewayMac)}/sensor-readings${suffix}`,
      )
      .pipe(map((items) => this.toResponse(items, params)));
  }

  private query(params?: {
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): string {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    return query.size ? `?${query.toString()}` : '';
  }

  private toResponse(
    items: SensorReadingBackendDto[] | null | undefined,
    params?: { variableType?: string; size?: number; page?: number },
  ): SensorReadingsResponse {
    let readings = (items ?? [])
      .map((dto, index) => this.toDomain(dto, index))
      .filter((r): r is SensorReading => r !== null);
    if (params?.variableType) {
      readings = readings.filter((r) => r.variableType === params.variableType);
    }
    // Keep chronological newest first for monitoring tables
    readings = [...readings].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    if (params?.size) {
      readings = readings.slice(0, params.size);
    }
    return {
      readings,
      totalElements: readings.length,
      totalPages: 1,
      page: params?.page ?? 1,
      size: params?.size ?? readings.length,
    };
  }

  private toDomain(dto: SensorReadingBackendDto, index: number): SensorReading | null {
    const mapped = SENSOR_MAP[dto.sensorType];
    const meta = mapped ?? {
      variableType: 'temperature' as const,
      labelKey: dto.sensorType,
      unit: dto.unit ?? '',
    };
    return {
      id: index + 1,
      deviceId: 0,
      plantationId: environment.demo.plantationId,
      monitoringZoneId: 0,
      userId: environment.demo.agronomistId,
      variableType: meta.variableType,
      label: meta.labelKey,
      sensorType: dto.sensorType,
      value: dto.value,
      unit: normalizeUnit(dto.unit, meta.unit),
      deviceSerial: dto.iotDeviceMacAddress,
      plantationName: `Sector context`,
      recordedAt: normalizeMeasuredAt(dto.measuredAt),
    };
  }
}

/**
 * Backend often returns "2026-07-10T15:33:25" without offset.
 * Without normalization, DatePipe can render broken short dates (e.g. "/10/26, 3:35 PM").
 * Treat bare local ISO as UTC so Angular formats a valid instant.
 */
function normalizeMeasuredAt(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    return `${s}Z`;
  }
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toISOString();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

function normalizeUnit(raw: string | null | undefined, fallback: string): string {
  if (!raw || raw === 'Unknown' || raw === 'unknown') return fallback;
  if (raw === 'Percent') return '%';
  if (raw === 'Celsius') return '°C';
  return raw;
}
