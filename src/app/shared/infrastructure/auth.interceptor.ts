import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

function isAuthUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/authentication/sign-in') ||
    url.includes('/authentication/sign-up')
  );
}

/** Fake local tokens must never be sent as Bearer (backend would 401). */
function isAttachableToken(token: string | null): token is string {
  if (!token) return false;
  if (token.startsWith('demo-token')) return false;
  return token.split('.').length === 3; // rough JWT shape
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const isAuthRequest = isAuthUrl(req.url);

  if (isAttachableToken(token)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthRequest &&
        !environment.demoAuth
      ) {
        const wasAdmin = authService.currentUser?.role === 'administrator';
        authService.logout();
        router.navigate([wasAdmin ? '/auth/login/admin' : '/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};
