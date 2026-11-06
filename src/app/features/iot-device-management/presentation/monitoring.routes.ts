import { Routes } from '@angular/router';

export const monitoringRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./monitoring-hub/monitoring-hub.component').then((m) => m.MonitoringHubComponent),
  },
];
