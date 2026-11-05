import { Routes } from '@angular/router';
import { adminGuard } from '../../shared/infrastructure/guards/admin.guard';

export const platformAdminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./views/admin-home/admin-home.component').then((m) => m.AdminHomeComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./views/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'growers',
        loadComponent: () =>
          import('./views/admin-growers/admin-growers.component').then((m) => m.AdminGrowersComponent),
      },
      {
        path: 'access',
        loadComponent: () =>
          import('./views/admin-access/admin-access.component').then((m) => m.AdminAccessComponent),
      },
      {
        path: 'field',
        loadComponent: () =>
          import('./views/admin-field/admin-field.component').then((m) => m.AdminFieldComponent),
      },
    ],
  },
];
