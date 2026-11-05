/** API response shape for the device endpoints. */
export interface DeviceResponse {
  id: number;
  userId: number;
  serialNumber: string;
  plantationId: number;
  plantationName?: string;
  monitoringZoneId: number;
  zoneName?: string;
  activationStatus: 'active' | 'inactive';
  connectivityStatus: 'connected' | 'disconnected' | 'offline_mode';
  healthStatus: 'healthy' | 'warning' | 'critical';
  samplingIntervalMinutes: number;
  transmissionMode: 'realtime' | 'batch';
  retryPolicy: string;
  maxOfflineStorageHours: number;
  lastSyncAt: string | null;
  offlineSince?: string;
  offlineHoursElapsed?: number;
  createdAt: string;
}
