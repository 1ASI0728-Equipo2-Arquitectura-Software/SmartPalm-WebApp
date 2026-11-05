export interface DeviceSummary {
  id: number;
  serialNumber: string;
  connectivityStatus: string;
  healthStatus: string;
}

export interface Zone {
  id: number;
  plantationId: number;
  name: string;
  hectares: number;
  description: string;
  cropHealthStatus: 'optimal' | 'at_risk' | 'critical';
  lastReadingAt: string | null;
  device?: DeviceSummary | null;
  createdAt: string;
}

export interface CreateZoneRequest {
  name: string;
  hectares: number;
  description: string;
}

export type UpdateZoneRequest = Partial<CreateZoneRequest>;
