import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type';

/**
 * Lightweight base class for API services.
 *
 * Provides the pre-configured HttpClient and the base API URL.
 * Extend ErrorHandlingEnabledBaseType so every service can reuse
 * the shared error handler without duplicating logic.
 */
export abstract class BaseApi extends ErrorHandlingEnabledBaseType {
  protected readonly http = inject(HttpClient);
  protected readonly apiUrl = environment.apiUrl;
}
