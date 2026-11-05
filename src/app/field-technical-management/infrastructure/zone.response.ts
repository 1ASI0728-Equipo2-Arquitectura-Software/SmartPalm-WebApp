/** API response shape for zone endpoints. */
export interface ZoneResponse {
  id: number;
  plantationId: number;
  name: string;
  hectares: number;
  description: string;
  cropHealthStatus: 'optimal' | 'at_risk' | 'critical';
  lastReadingAt: string | null;
  device?: {
    id: number;
    serialNumber: string;
    connectivityStatus: string;
    healthStatus: string;
  } | null;
  createdAt: string;
}
