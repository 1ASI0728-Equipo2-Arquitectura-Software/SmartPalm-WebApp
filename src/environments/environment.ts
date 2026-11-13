export const environment = {
  production: false,
  /** Local SmartPalm microservices API Gateway. */
  apiUrl: 'http://localhost:5100/api/v1',
  /** Always real backend for this project (mock retired). */
  dataSource: 'real' as 'real' | 'mock',
  /** Real IAM sign-in (POST /authentication/sign-in). No public register. */
  demoAuth: false,
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
