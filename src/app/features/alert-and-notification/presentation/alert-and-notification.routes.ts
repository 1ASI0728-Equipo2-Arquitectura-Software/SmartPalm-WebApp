import { Routes } from '@angular/router';

export const alertRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./alert-list/alert-list.component').then((m) => m.AlertListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./alert-detail/alert-detail.component').then((m) => m.AlertDetailComponent),
  },
];