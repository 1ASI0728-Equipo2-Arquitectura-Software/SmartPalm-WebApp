import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
];
