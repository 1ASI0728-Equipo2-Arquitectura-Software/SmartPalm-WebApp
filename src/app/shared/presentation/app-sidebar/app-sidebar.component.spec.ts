/**
 * Phase 1 — Sidebar Component i18n Tests (Strict TDD)
 *
 * Since sidebar labels use lazy getters with $localize, loadTranslations()
 * can be called before compileComponents() and the values are resolved
 * at access time.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { AppSidebarComponent } from './app-sidebar.component';
import { AuthService } from '../../../shared/infrastructure/auth.service';
import { User } from '../../../shared/domain/user.model';

// --- Translation Maps ---

const SIDEBAR_ES: Record<string, string> = {
  'sidebar.dashboard': 'Dashboard',
  'sidebar.operationsCenter': 'Centro de operaciones',
  'sidebar.plantationPortfolio': 'Cartera de plantaciones',
  'sidebar.alerts': 'Alertas',
  'sidebar.recommendations': 'Recomendaciones',
  'sidebar.reports': 'Reportes',
  'sidebar.inspections': 'Inspecciones',
  'sidebar.mySubscription': 'Mi suscripción',
  'sidebar.myProfile': 'Mi perfil',
  'sidebar.logout': 'Cerrar sesión',
  'sidebar.role.agronomist': 'Agrónomo',
  'sidebar.role.grower': 'Productor',
};

const SIDEBAR_EN: Record<string, string> = {
  'sidebar.dashboard': 'Dashboard',
  'sidebar.operationsCenter': 'Operations Center',
  'sidebar.plantationPortfolio': 'Plantation Portfolio',
  'sidebar.alerts': 'Alerts',
  'sidebar.recommendations': 'Recommendations',
  'sidebar.reports': 'Reports',
  'sidebar.inspections': 'Inspections',
  'sidebar.mySubscription': 'My Subscription',
  'sidebar.myProfile': 'My Profile',
  'sidebar.logout': 'Log out',
  'sidebar.role.agronomist': 'Agronomist',
  'sidebar.role.grower': 'Grower',
};

// --- Test Helpers ---

@Component({ template: '' })
class DummyComponent {}

function createMockAgronomist(): User {
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
  };
}

function setupTestBed(locale: 'es' | 'en', user: User | null) {
  const authMock = {
    currentUser: user,
    isAuthenticated: !!user,
    logout: vi.fn(),
  };

  return TestBed.configureTestingModule({
    imports: [AppSidebarComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AuthService, useValue: authMock },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'plantaciones', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
        { path: 'recomendaciones', component: DummyComponent },
        { path: 'reportes', component: DummyComponent },
        { path: 'inspecciones', component: DummyComponent },
        { path: 'subscription/me', component: DummyComponent },
        { path: 'profile', component: DummyComponent },
        { path: 'auth/login', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

function getNavLinkTexts(el: HTMLElement): string[] {
  const links = el.querySelectorAll('nav a[class*="rounded"]');
  return Array.from(links).map((l) => (l as HTMLElement).textContent?.trim() ?? '');
}

// --- Tests ---

describe('AppSidebarComponent — i18n', () => {
  const agronomist = createMockAgronomist();

  describe('Agronomist nav labels in Spanish', () => {
    it('1.3: should show Spanish labels when LOCALE_ID=es', async () => {
      loadTranslations(SIDEBAR_ES);
      await setupTestBed('es', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const navTexts = getNavLinkTexts(el);
      const accountLinks = el.querySelectorAll('div:nth-of-type(2) a[class*="rounded"]');
      const accountTexts = Array.from(accountLinks).map((l) => (l as HTMLElement).textContent?.trim() ?? '');
      const allTexts = [...navTexts, ...accountTexts];

      expect(allTexts).toContain('Dashboard');
      expect(allTexts).toContain('Cartera de plantaciones');
      expect(allTexts).toContain('Alertas');
      expect(allTexts).toContain('Recomendaciones');
      expect(allTexts).toContain('Reportes');
      expect(allTexts).toContain('Inspecciones');
      expect(allTexts).toContain('Mi suscripción');
      expect(allTexts).toContain('Mi perfil');
    });

    it('1.3: should show role label "Agrónomo" in Spanish', async () => {
      loadTranslations(SIDEBAR_ES);
      await setupTestBed('es', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const roleLabel = el.querySelector('[data-testid="sidebar-role-label"]');
      expect(roleLabel).not.toBeNull();
      expect(roleLabel?.textContent?.trim()).toBe('Agrónomo');
    });

    it('1.3: should show logout "Cerrar sesión" in Spanish', async () => {
      loadTranslations(SIDEBAR_ES);
      await setupTestBed('es', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const logoutBtn = el.querySelector('button');
      expect(logoutBtn).not.toBeNull();
      expect(logoutBtn?.textContent?.trim()).toBe('Cerrar sesión');
    });
  });

  describe('Agronomist nav labels in English', () => {
    it('1.3: should show English labels when LOCALE_ID=en', async () => {
      loadTranslations(SIDEBAR_EN);
      await setupTestBed('en', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const navTexts = getNavLinkTexts(el);
      const accountLinks = el.querySelectorAll('div:nth-of-type(2) a[class*="rounded"]');
      const accountTexts = Array.from(accountLinks).map((l) => (l as HTMLElement).textContent?.trim() ?? '');
      const allTexts = [...navTexts, ...accountTexts];

      expect(allTexts).toContain('Dashboard');
      expect(allTexts).toContain('Plantation Portfolio');
      expect(allTexts).toContain('Alerts');
      expect(allTexts).toContain('Recommendations');
      expect(allTexts).toContain('Reports');
      expect(allTexts).toContain('Inspections');
      expect(allTexts).toContain('My Subscription');
      expect(allTexts).toContain('My Profile');
    });

    it('1.3: should show role label "Agronomist" in English', async () => {
      loadTranslations(SIDEBAR_EN);
      await setupTestBed('en', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const roleLabel = el.querySelector('[data-testid="sidebar-role-label"]');
      expect(roleLabel).not.toBeNull();
      expect(roleLabel?.textContent?.trim()).toBe('Agronomist');
    });

    it('1.3: should show logout "Log out" in English', async () => {
      loadTranslations(SIDEBAR_EN);
      await setupTestBed('en', agronomist).compileComponents();
      const fixture = TestBed.createComponent(AppSidebarComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const logoutBtn = el.querySelector('button');
      expect(logoutBtn).not.toBeNull();
      expect(logoutBtn?.textContent?.trim()).toBe('Log out');
    });
  });
});
