/**
 * Phase 0 — LOCALE_ID Injection Tests
 *
 * Validates that LOCALE_ID defaults to 'es' on the client and is properly
 * overridden from URL prefix in SSR context.
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { appConfig } from './app.config';

describe('LOCALE_ID — Client default', () => {
  it('0.6: should provide LOCALE_ID = "es" in appConfig', () => {
    // Verify appConfig contains LOCALE_ID provider with value 'es'
    const localeProvider = appConfig.providers.find(
      (p) => typeof p === 'object' && 'provide' in p && p.provide === LOCALE_ID,
    ) as { provide: typeof LOCALE_ID; useValue: string } | undefined;

    expect(localeProvider).toBeDefined();
    expect(localeProvider!.useValue).toBe('es');
  });

  it('0.6: should resolve LOCALE_ID as "es" from TestBed', async () => {
    // Build TestBed with the same provider shape as appConfig
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideClientHydration(withEventReplay()),
        // Include LOCALE_ID provider if it exists in appConfig
        ...appConfig.providers,
      ],
    }).compileComponents();

    const localeId = TestBed.inject(LOCALE_ID);
    expect(localeId).toBe('es');
  });
});
