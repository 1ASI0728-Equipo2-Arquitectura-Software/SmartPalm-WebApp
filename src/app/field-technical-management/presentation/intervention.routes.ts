import { Routes } from '@angular/router';

export const interventionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/intervention-list/intervention-list.component').then(
        (m) => m.InterventionListComponent,
      ),
  },
];
