/**
 * Phase 1 — Notification Dropdown i18n Tests (Strict TDD)
 *
 * Tests locale-aware labels: header, empty state, mark read actions,
 * and error fallback messages per shell-i18n spec.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { of } from 'rxjs';
import { NotificationDropdownComponent } from './notification-dropdown.component';
import { NotificationService } from '../../infrastructure/notification.service';
import { Notification } from '../../../alert-and-notification/domain/model/notification.entity';

// --- Test Helpers ---

@Component({ template: '' })
class DummyComponent {}

function createMockNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: 1,
    userId: 1,
    type: 'alert_critical',
    title: 'Alerta de prueba',
    body: 'Cuerpo de la notificación',
    relatedResourceType: 'alert',
    relatedResourceId: 42,
    read: false,
    createdAt: '2026-06-20T10:00:00Z',
    ...overrides,
  };
}

function setupTestBed(locale: 'es' | 'en', opts?: { withNotifications?: boolean }) {
  const sampleNotification: Notification = {
    id: 1,
    userId: 1,
    type: 'alert_critical',
    title: 'Alerta de prueba',
    body: 'Cuerpo de la notificación',
    relatedResourceType: 'alert',
    relatedResourceId: 42,
    read: false,
    createdAt: '2026-06-20T10:00:00Z',
  };

  const notificationSvcMock = {
    list: vi.fn().mockReturnValue(of({
      totalElements: opts?.withNotifications ? 1 : 0,
      unreadCount: opts?.withNotifications ? 1 : 0,
      notifications: opts?.withNotifications ? [sampleNotification] : [],
    })),
    count: vi.fn().mockReturnValue(of({ unreadCount: opts?.withNotifications ? 1 : 0 })),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  };

  return TestBed.configureTestingModule({
    imports: [NotificationDropdownComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: NotificationService, useValue: notificationSvcMock },
      provideRouter([]),
      provideHttpClient(),
    ],
  });
}

// --- Tests ---

describe('NotificationDropdownComponent — i18n', () => {
  describe('Spanish labels (LOCALE_ID=es)', () => {
    it('1.5: should show header "Notificaciones" in Spanish', async () => {
      await setupTestBed('es').compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.detectChanges();

      // Open the dropdown to see content
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const header = el.querySelector('h3');
      expect(header).not.toBeNull();
      expect(header?.textContent?.trim()).toBe('Notificaciones');
    });

    it('1.5: should show empty state in Spanish when no notifications', async () => {
      await setupTestBed('es').compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('No tienes notificaciones recientes');
    });

    it('1.5: should show "Marcar todas leídas" in Spanish when unread > 0', async () => {
      await setupTestBed('es', { withNotifications: true }).compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.unreadCount.set(3);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Marcar todas');
    });

    it('1.5: should show "Marcar leída" on unread notification in Spanish', async () => {
      await setupTestBed('es', { withNotifications: true }).compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Marcar leída');
    });
  });

  describe('English labels (LOCALE_ID=en)', () => {
    const enTranslations: Record<string, string> = {
      'notifications.header': 'Notifications',
      'notifications.empty': 'No recent notifications',
      'notifications.markAllRead': 'Mark all as read',
      'notifications.markRead': 'Mark as read',
      'notifications.markError': 'Could not mark as read',
      'notifications.markAllError': 'Could not mark all as read',
      'notifications.loadError': 'Could not load notifications',
    };

    it('1.5: should show header "Notifications" in English', async () => {
      loadTranslations(enTranslations);
      await setupTestBed('en').compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const header = el.querySelector('h3');
      expect(header).not.toBeNull();
      expect(header?.textContent?.trim()).toBe('Notifications');
    });

    it('1.5: should show empty state "No recent notifications" in English', async () => {
      loadTranslations(enTranslations);
      await setupTestBed('en').compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('No recent notifications');
    });

    it('1.5: should show "Mark all as read" in English', async () => {
      loadTranslations(enTranslations);
      await setupTestBed('en', { withNotifications: true }).compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.unreadCount.set(3);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Mark all as read');
    });

    it('1.5: should show "Mark as read" on unread notification in English', async () => {
      loadTranslations(enTranslations);
      await setupTestBed('en', { withNotifications: true }).compileComponents();
      const fixture = TestBed.createComponent(NotificationDropdownComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Mark as read');
    });
  });
});
