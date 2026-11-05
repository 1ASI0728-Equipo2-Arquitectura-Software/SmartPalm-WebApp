export const environment = {
  production: false,
  /**
   * Local SmartPalm .NET API (Swagger: https://localhost:7277/index.html).
   * When the team deploys, switch this URL to the hosted base.
   */
  apiUrl: 'https://localhost:7277/api/v1',
  /** Always real backend for this project (mock retired). */
  dataSource: 'real' as 'real' | 'mock',
  /** Real IAM sign-in (POST /authentication/sign-in). No public register. */
  demoAuth: false,
  demo: {
    /** Fallback ids when listing context is not available yet. */
    plantationId: 1,
    /**
     * Local seed agronomist (IAM):
     * id=3, username=agronomist01, email=agro1@smartpalm.com,
     * fullName=Agronomist One, role=Agronomist, password=Agro#2026
     */
    agronomistId: 3,
    /** Sector Norte IoT MAC from local e2e seed. */
    deviceMac: 'AA:BB:CC:DD:EE:01',
    gatewayMac: 'AA:BB:CC:00:00:01',
    sectorId: 1,
  },
  features: {
    recommendations: true,
    sensors: true,
    iotStatus: true,
    monitoring: true,
    interventions: true,
    subscriptionApi: true,
    /** Out of agronomist desk path for now */
    alerts: false,
    reports: false,
    inspections: false,
    notifications: false,
    plantationsApi: false,
  },
};
