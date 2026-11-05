import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  if (authService.currentUser?.role === 'administrator') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/dashboard']);
};
