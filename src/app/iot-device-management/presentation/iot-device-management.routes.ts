import { Routes } from '@angular/router';
import { growerGuard } from '../../shared/infrastructure/guards/grower.guard';
import { subscriptionActiveGuard } from '../../shared/infrastructure/guards/subscription-active.guard';

export const deviceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/device-list/device-list.component').then((m) => m.DeviceListComponent),
  },
  {
    path: 'new',
    canActivate: [growerGuard, subscriptionActiveGuard],
    loadComponent: () =>
      import('./views/device-form/device-form.component').then((m) => m.DeviceFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/device-detail/device-detail.component').then((m) => m.DeviceDetailComponent),
  },
];
