import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * Reusable error-handling helper for infrastructure classes.
 *
 * Usage inside a pipe:
 *   catchError((err: unknown) => this.handleError(err, 'Fallback message'))
 */
export abstract class ErrorHandlingEnabledBaseType {
  protected handleError(error: unknown, fallbackMessage: string): Observable<never> {
    const message =
      error instanceof HttpErrorResponse
        ? error.error?.message || fallbackMessage
        : fallbackMessage;

    return throwError(() => new Error(message));
  }
}
