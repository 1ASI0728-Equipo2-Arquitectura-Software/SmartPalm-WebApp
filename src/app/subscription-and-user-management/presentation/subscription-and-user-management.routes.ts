import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  /**
   * Hidden admin entry for demos (second browser tab):
   * /auth/login/admin — declare BEFORE plain `login` so it never gets swallowed.
   */
  {
    path: 'login/admin',
    loadComponent: () => import('./views/login/login.component').then((m) => m.LoginComponent),
    data: { adminLogin: true },
  },
  {
    path: 'login',
    loadComponent: () => import('./views/login/login.component').then((m) => m.LoginComponent),
  },
  // Public sign-up removed (IAM: only admin creates users via POST /admin/users).
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  { path: 'recover-password', redirectTo: 'login', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/my-profile/my-profile.component').then((m) => m.MyProfileComponent),
  },
];

export const subscriptionRoutes: Routes = [
  {
    path: 'plans',
    loadComponent: () =>
      import('./views/plans/plans.component').then((m) => m.PlansComponent),
  },
  {
    path: 'me',
    loadComponent: () =>
      import('./views/my-subscription/my-subscription.component').then((m) => m.MySubscriptionComponent),
  },
  { path: '', redirectTo: 'plans', pathMatch: 'full' },
];