/**
 * Phase 1 — Navbar Component i18n Tests (Strict TDD)
 *
 * Tests locale-aware behavior: language toggle, login CTA, user menu labels,
 * and route-preserving locale switch.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../shared/infrastructure/auth.service';
import { User } from '../../../shared/domain/user.model';

// --- Translation Maps ---

const NAVBAR_ES: Record<string, string> = {
  'navbar.loginCTA': 'Iniciar sesión',
  'navbar.profile': 'Perfil',
  'navbar.myPlan': 'Mi plan',
  'navbar.role.agronomist': 'Agrónomo',
  'navbar.role.grower': 'Productor',
};

const NAVBAR_EN: Record<string, string> = {
  'navbar.loginCTA': 'Log in',
  'navbar.profile': 'Profile',
  'navbar.myPlan': 'My Plan',
  'navbar.role.agronomist': 'Agronomist',
  'navbar.role.grower': 'Grower',
};

// --- Test Helpers ---

@Component({ template: '' })
class DummyComponent {}

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: 'agronomist@smartpalm.com',
    fullName: 'Dr. Juan Pérez',
    role: 'agronomist',
    phone: '+1234567890',
    region: 'Oriente',
    city: 'Bogotá',
    avatarUrl: null,
    subscriptionId: 'sub_001',
    createdAt: '2026-01-01',
    ...overrides,
  };
}

function setupTestBed(locale: 'es' | 'en', user: User | null) {
  const authMock = {
    currentUser: user,
    isAuthenticated: !!user,
    logout: vi.fn(),
  };

  return TestBed.configureTestingModule({
    imports: [NavbarComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AuthService, useValue: authMock },
      provideRouter([
        { path: 'auth/login', component: DummyComponent },
        { path: 'dashboard', component: DummyComponent },
        { path: 'profile', component: DummyComponent },
        { path: 'subscription/me', component: DummyComponent },
        { path: 'subscription/plans', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
        { path: 'alertas/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

// --- Tests ---

describe('NavbarComponent — i18n', () => {
  describe('Language toggle button', () => {
    it('1.1: should show "English" when current locale is es', async () => {
      await setupTestBed('es', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const toggleBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="locale-toggle"]',
      );
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn?.textContent?.trim()).toBe('English');
    });

    it('1.1: should show "Español" when current locale is en', async () => {
      await setupTestBed('en', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const toggleBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="locale-toggle"]',
      );
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn?.textContent?.trim()).toBe('Español');
    });
  });

  describe('switchLanguage()', () => {
    it('1.1: should navigate to /en/ prefix when current locale is es', async () => {
      await setupTestBed('es', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      // Simulate being on /es/dashboard
      Object.defineProperty(router, 'url', { value: '/es/dashboard' });

      const component = fixture.componentInstance;
      component.switchLanguage();

      expect(navigateSpy).toHaveBeenCalledWith('/en/dashboard');
    });

    it('1.1: should navigate to /es/ prefix when current locale is en', async () => {
      await setupTestBed('en', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      // Simulate being on /en/alertas/42?tab=historial
      Object.defineProperty(router, 'url', { value: '/en/alertas/42?tab=historial' });

      const component = fixture.componentInstance;
      component.switchLanguage();

      expect(navigateSpy).toHaveBeenCalledWith('/es/alertas/42?tab=historial');
    });

    it('1.1: should preserve root route on toggle', async () => {
      await setupTestBed('es', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      Object.defineProperty(router, 'url', { value: '/es/' });

      const component = fixture.componentInstance;
      component.switchLanguage();

      expect(navigateSpy).toHaveBeenCalledWith('/en/');
    });
  });

  describe('Login CTA (unauthenticated)', () => {
    it('1.1: should show "Iniciar sesión" when LOCALE_ID=es', async () => {
      await setupTestBed('es', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      // The login link should contain "Iniciar sesión" or "Iniciar sesi&oacute;n"
      const loginLink = el.querySelector('a[routerlink="/auth/login"]');
      expect(loginLink).not.toBeNull();
      expect(loginLink?.textContent?.trim()).toMatch(/Iniciar sesi[óo]n/);
    });

    it('1.1: should show "Log in" when LOCALE_ID=en', async () => {
      loadTranslations(NAVBAR_EN);

      await setupTestBed('en', null).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const loginLink = el.querySelector('a[routerlink="/auth/login"]');
      expect(loginLink).not.toBeNull();
      expect(loginLink?.textContent?.trim()).toBe('Log in');
    });
  });

  describe('User menu labels (authenticated agronomist)', () => {
    const agronomist = createMockUser();

    it('1.1: should show "Perfil" and "Mi plan" in Spanish', async () => {
      loadTranslations(NAVBAR_ES);
      await setupTestBed('es', agronomist).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll('a[class*="rounded-2xl"]');
      const linkTexts = Array.from(links).map((l) => (l as HTMLElement).textContent?.trim() ?? '');

      expect(linkTexts).toContain('Perfil');
      expect(linkTexts).toContain('Mi plan');
    });

    it('1.1: should show "Profile" and "My Plan" in English', async () => {
      loadTranslations(NAVBAR_EN);

      await setupTestBed('en', agronomist).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll('a[class*="rounded-2xl"]');
      const linkTexts = Array.from(links).map((l) => (l as HTMLElement).textContent?.trim() ?? '');

      expect(linkTexts).toContain('Profile');
      expect(linkTexts).toContain('My Plan');
    });

    it('1.1: should show role label in Spanish', async () => {
      loadTranslations(NAVBAR_ES);
      await setupTestBed('es', agronomist).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      // The role span is inside the user menu button
      const roleLabel = el.querySelector('[data-testid="user-role-label"]');
      expect(roleLabel).not.toBeNull();
      expect(roleLabel?.textContent?.trim()).toBe('Agrónomo');
    });

    it('1.1: should show role label "Agronomist" in English', async () => {
      loadTranslations(NAVBAR_EN);

      await setupTestBed('en', agronomist).compileComponents();
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const roleLabel = el.querySelector('[data-testid="user-role-label"]');
      expect(roleLabel).not.toBeNull();
      expect(roleLabel?.textContent?.trim()).toBe('Agronomist');
    });
  });
});
