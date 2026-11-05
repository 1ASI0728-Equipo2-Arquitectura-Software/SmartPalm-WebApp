import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Agronomist operations desk — keep administrators on /admin
 * so the two consoles stay separated.
 */
export const deskGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }
  if (auth.currentUser?.role === 'administrator') {
    return router.createUrlTree(['/admin']);
  }
  return true;
};
