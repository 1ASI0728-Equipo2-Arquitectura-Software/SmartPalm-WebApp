import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message.trim()) return body.message;
      if (typeof body.title === 'string' && body.title.trim()) return body.title;
      // ASP.NET validation dictionary
      if (body.errors && typeof body.errors === 'object') {
        const first = Object.values(body.errors as Record<string, string[]>)
          .flat()
          .find((m) => typeof m === 'string' && m.trim());
        if (first) return first;
      }
    }
    return fallback;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
