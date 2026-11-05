import { Routes } from '@angular/router';

export const monitoringRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/monitoring-hub/monitoring-hub.component').then((m) => m.MonitoringHubComponent),
  },
];
