/**
 * Alert domain entity.
 *
 * Represents an environmental alert generated when a sensor reading
 * falls outside configured thresholds for a monitored zone.
 */
export interface Alert {
  id: number;
  userId: number;
  plantationId: number;
  plantationName: string;
  monitoringZoneId: number;
  zoneName: string;
  deviceId: number;
  variableType: string;
  label: string;
  alertLevel: 'critical' | 'warning' | 'informative';
  title: string;
  message: string;
  triggeredValue: number;
  thresholdMin: number;
  thresholdMax: number;
  status: 'active' | 'resolved';
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface AlertListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  alerts: Alert[];
}

export interface AlertCount {
  total: number;
  critical: number;
  warning: number;
  informative: number;
  unacknowledged: number;
}
