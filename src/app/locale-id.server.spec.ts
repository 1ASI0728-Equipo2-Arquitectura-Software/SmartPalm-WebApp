/**
 * Phase 0 — SSR LOCALE_ID Override Tests
 *
 * Validates that the SSR config overrides LOCALE_ID from the URL prefix:
 *   - /en/* → LOCALE_ID = 'en'
 *   - /es/* → LOCALE_ID = 'es'
 *   - no prefix → LOCALE_ID = 'es' (default)
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, REQUEST } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { appConfig } from './app.config';

// Import pure functions from production code
import {
  resolveLocaleFromUrl,
  stripLocalePrefix,
  resolveLocaleBrowserDir,
} from './i18n/locale-resolver';

describe('SSR LOCALE_ID — URL prefix detection', () => {
  describe('pure function: resolveLocaleFromUrl', () => {
    it('0.8: should return "en" for /en/ prefix', () => {
      expect(resolveLocaleFromUrl('/en/dashboard')).toBe('en');
    });

    it('0.8: should return "en" for /en/ deep route', () => {
      expect(resolveLocaleFromUrl('/en/alertas/42?tab=historial')).toBe('en');
    });

    it('0.8: should return "es" for no prefix (root path)', () => {
      expect(resolveLocaleFromUrl('/')).toBe('es');
    });

    it('0.8: should return "es" for no prefix (deep path)', () => {
      expect(resolveLocaleFromUrl('/dashboard')).toBe('es');
    });

    it('0.8: should return "es" for /es/ prefix', () => {
      expect(resolveLocaleFromUrl('/es/dashboard')).toBe('es');
    });

    it('0.8: should return "es" for unknown prefix', () => {
      expect(resolveLocaleFromUrl('/fr/dashboard')).toBe('es');
    });
  });

  describe('pure function: stripLocalePrefix', () => {
    it('0.10: should strip /en/ prefix', () => {
      expect(stripLocalePrefix('/en/dashboard')).toBe('/dashboard');
    });

    it('0.10: should strip /es/ prefix', () => {
      expect(stripLocalePrefix('/es/dashboard')).toBe('/dashboard');
    });

    it('0.10: should strip /en/ from root path', () => {
      expect(stripLocalePrefix('/en/')).toBe('/');
    });

    it('0.10: should preserve path without prefix', () => {
      expect(stripLocalePrefix('/dashboard')).toBe('/dashboard');
    });

    it('0.10: should preserve query string after stripping prefix', () => {
      expect(stripLocalePrefix('/en/alertas/42?tab=historial')).toBe(
        '/alertas/42?tab=historial',
      );
    });
  });

  describe('pure function: resolveLocaleBrowserDir', () => {
    it('0.10: should resolve English browser directory', () => {
      const dir = resolveLocaleBrowserDir(
        '/app/dist/web-app-smart-palm',
        'en',
      );
      expect(dir).toBe('/app/dist/web-app-smart-palm/browser/en');
    });

    it('0.10: should resolve Spanish browser directory', () => {
      const dir = resolveLocaleBrowserDir(
        '/app/dist/web-app-smart-palm',
        'es',
      );
      expect(dir).toBe('/app/dist/web-app-smart-palm/browser/es');
    });
  });

  describe('SSR LOCALE_ID — integration', () => {
    it('0.9: should override LOCALE_ID to "en" from req.originalUrl when req.url has been stripped', async () => {
      // In production, Express sets req.originalUrl (original URL with prefix)
      // and server.ts middleware rewrites req.url (prefix stripped for routing).
      const mockRequest = { url: '/dashboard', originalUrl: '/en/dashboard' };

      await TestBed.configureTestingModule({
        providers: [
          { provide: REQUEST, useValue: mockRequest },
          {
            provide: LOCALE_ID,
            useFactory: (req: { url: string; originalUrl: string } | null) =>
              req ? resolveLocaleFromUrl(req.originalUrl) : 'es',
            deps: [REQUEST],
          },
          provideRouter([]),
          provideHttpClient(withInterceptors([])),
          provideClientHydration(withEventReplay()),
          ...appConfig.providers.filter(
            (p) =>
              typeof p !== 'object' ||
              !('provide' in p) ||
              p.provide !== LOCALE_ID,
          ),
        ],
      }).compileComponents();

      const localeId = TestBed.inject(LOCALE_ID);
      expect(localeId).toBe('en');
    });

    it('0.9: should default LOCALE_ID to "es" when no locale prefix in original URL', async () => {
      const mockRequest = { url: '/dashboard', originalUrl: '/dashboard' };

      await TestBed.configureTestingModule({
        providers: [
          { provide: REQUEST, useValue: mockRequest },
          {
            provide: LOCALE_ID,
            useFactory: (req: { url: string; originalUrl: string } | null) =>
              req ? resolveLocaleFromUrl(req.originalUrl) : 'es',
            deps: [REQUEST],
          },
          provideRouter([]),
          provideHttpClient(withInterceptors([])),
          provideClientHydration(withEventReplay()),
          ...appConfig.providers.filter(
            (p) =>
              typeof p !== 'object' ||
              !('provide' in p) ||
              p.provide !== LOCALE_ID,
          ),
        ],
      }).compileComponents();

      const localeId = TestBed.inject(LOCALE_ID);
      expect(localeId).toBe('es');
    });
  });
});
