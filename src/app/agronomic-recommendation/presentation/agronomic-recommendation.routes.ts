import { Routes } from '@angular/router';
import { agronomistGuard } from '../../shared/infrastructure/guards/agronomist.guard';

export const recommendationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/recommendation-list/recommendation-list.component').then(
        (m) => m.RecommendationListComponent,
      ),
  },
  {
    path: 'new',
    canActivate: [agronomistGuard],
    loadComponent: () =>
      import('./views/recommendation-form/recommendation-form.component').then(
        (m) => m.RecommendationFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/recommendation-detail/recommendation-detail.component').then(
        (m) => m.RecommendationDetailComponent,
      ),
  },
];

export const reportRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/report-list/report-list.component').then((m) => m.ReportListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./views/report-detail/report-detail.component').then((m) => m.ReportDetailComponent),
  },
];
