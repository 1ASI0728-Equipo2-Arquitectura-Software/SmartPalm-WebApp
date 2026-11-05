import { Routes } from '@angular/router';
import { growerGuard } from '../../shared/infrastructure/guards/grower.guard';
import { subscriptionActiveGuard } from '../../shared/infrastructure/guards/subscription-active.guard';
import { agronomistGuard } from '../../shared/infrastructure/guards/agronomist.guard';

export const plantationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/plantation-list/plantation-list.component').then((m) => m.PlantationListComponent),
  },
  {
    path: 'new',
    canActivate: [growerGuard, subscriptionActiveGuard],
    loadComponent: () =>
      import('./views/plantation-form/plantation-form.component').then((m) => m.PlantationFormComponent),
  },
  {
    path: ':id/edit',
    canActivate: [growerGuard, subscriptionActiveGuard],
    loadComponent: () =>
      import('./views/plantation-form/plantation-form.component').then((m) => m.PlantationFormComponent),
  },
  {
    path: ':plantationId/zones/new',
    canActivate: [growerGuard, subscriptionActiveGuard],
    loadComponent: () => import('./views/zone-form/zone-form.component').then((m) => m.ZoneFormComponent),
  },
  {
    path: ':plantationId/zones/:zoneId/edit',
    canActivate: [growerGuard, subscriptionActiveGuard],
    loadComponent: () => import('./views/zone-form/zone-form.component').then((m) => m.ZoneFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/plantation-detail/plantation-detail.component').then((m) => m.PlantationDetailComponent),
  },
];

export const inspectionRoutes: Routes = [
  {
    path: '',
    canActivate: [agronomistGuard],
    loadComponent: () =>
      import('./views/inspection-list/inspection-list.component').then((m) => m.InspectionListComponent),
  },
  {
    path: ':id',
    canActivate: [agronomistGuard],
    loadComponent: () =>
      import('./views/inspection-detail/inspection-detail.component').then((m) => m.InspectionDetailComponent),
  },
];