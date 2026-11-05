export interface SensorReading {
  id: number;
  deviceId: number;
  plantationId: number;
  monitoringZoneId: number;
  userId: number;
  /** Backend SensorType mapped for UI/charts. */
  variableType: 'temperature' | 'soil_humidity' | 'soil_ph' | 'luminosity' | 'soil_moisture';
  /** Raw backend sensorType when available. */
  sensorType?: string;
  label: string;
  value: number;
  unit: string;
  deviceSerial?: string;
  plantationName?: string;
  recordedAt: string;
}

export interface SensorReadingsResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  readings: SensorReading[];
}
