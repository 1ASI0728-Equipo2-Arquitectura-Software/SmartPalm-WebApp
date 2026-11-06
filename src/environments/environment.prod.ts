export const environment = {
  production: true,
  apiUrl: 'https://smart-palm-platform.onrender.com/api/v1',
  dataSource: 'real' as 'real' | 'mock',
  demoAuth: false,
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
