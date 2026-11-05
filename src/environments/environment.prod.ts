export const environment = {
  production: true,
  apiUrl: 'https://smart-palm-platform.onrender.com/api/v1',
  dataSource: 'real' as 'real' | 'mock',
  demoAuth: false,
  demo: {
    plantationId: 1,
    agronomistId: 3,
    /**
     * Fallback MACs when API discovery fails.
     * Live Render (2026-07): gateway 24:6f:28:a1:74:8c, IoT 30:76:f5:a5:88:f8.
     * Prefer runtime discovery via IotDeviceContextService.
     */
    deviceMac: '30:76:f5:a5:88:f8',
    gatewayMac: '24:6f:28:a1:74:8c',
    sectorId: 1,
  },
  features: {
    recommendations: true,
    sensors: true,
    iotStatus: true,
    monitoring: true,
    interventions: true,
    subscriptionApi: true,
    alerts: false,
    reports: false,
    inspections: false,
    notifications: false,
    plantationsApi: false,
  },
};
