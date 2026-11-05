import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/** Requires authenticated Administrator. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/auth/login/admin']);
  }
  if (auth.currentUser?.role !== 'administrator') {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
