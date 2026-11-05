/**
 * Phase 2 — Alert Components i18n Tests (Strict TDD)
 *
 * Tests locale-aware behavior: severity labels, tab labels, empty states,
 * button text, status labels, variable labels, form labels, error messages.
 *
 * ⚠️ ORDER MATTERS: Spanish tests first, then English.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { loadTranslations } from '@angular/localize';
import { AlertListComponent } from './alert-list.component';
import { AlertAndNotificationStore } from '../../../application/alert-and-notification.store';

// --- Test Helpers ---

@Component({ template: '' })
class DummyComponent {}

function createMockAlertStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    alerts: signal([]),
    alertsLoading: signal(false),
    alertsError: signal(''),
    activeTab: signal('active' as 'active' | 'resolved'),
    badgeCount: signal(null),
    acknowledgingId: signal(0),
    acknowledgeError: signal(''),
    alert: signal(null),
    alertLoading: signal(false),
    alertError: signal(''),
    alertSaving: signal(false),
    alertActionError: signal(''),
    alertActionSuccess: signal(''),
    ...overrides,
  };

  return {
    ...defaults,
    loadAlerts: vi.fn(),
    loadAlertCount: vi.fn(),
    setTab: vi.fn(),
    acknowledgeAlert: vi.fn(),
    loadAlert: vi.fn(),
    acknowledgeAlertDetail: vi.fn(),
  } as unknown as AlertAndNotificationStore;
}

function setupListTestBed(locale: 'es' | 'en', store: ReturnType<typeof createMockAlertStore>) {
  return TestBed.configureTestingModule({
    imports: [AlertListComponent],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      { provide: AlertAndNotificationStore, useValue: store },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'alertas', component: DummyComponent },
        { path: 'alertas/:id', component: DummyComponent },
      ]),
      provideHttpClient(),
    ],
  });
}

const EN: Record<string, string> = {
  'alert.severity.critical': 'Critical',
  'alert.severity.warning': 'Warning',
  'alert.severity.informative': 'Informative',
  'alert.list.heading.subtitle': 'Monitoring of critical conditions, active alerts and event history by zone.',
  'alert.list.badge.active': 'active',
  'alert.list.badge.critical': 'critical',
  'alert.list.badge.unacknowledged': 'unconfirmed',
  'alert.list.tab.active': 'Active',
  'alert.list.tab.resolved': 'History',
  'alert.list.loading': 'Loading alerts...',
  'alert.list.emptyActive': 'No active alerts',
  'alert.list.emptyActiveDesc': 'All monitored conditions are within normal ranges.',
  'alert.list.emptyResolved': 'No history',
  'alert.list.emptyResolvedDesc': 'No resolved alerts have been recorded yet.',
  'alert.list.status.confirmed': 'Confirmed',
  'alert.list.status.pending': 'Pending',
  'alert.list.status.resolved': 'Resolved',
  'alert.list.button.acknowledge': 'Confirm receipt',
  'alert.list.button.acknowledging': 'Confirming...',
  'alert.list.value.label': 'value',
  'alert.list.range.label': 'Range:',
  'alert.section.management': 'Alert Management',
  'alert.detail.loading': 'Loading detail...',
  'alert.detail.back': '← Back to alerts',
  'alert.detail.measurement': 'Measurement',
  'alert.detail.expectedRange': 'Expected Range',
  'alert.detail.current': 'Current:',
  'alert.detail.plantation': 'Plantation',
  'alert.detail.zone': 'Zone',
  'alert.detail.variable': 'Variable',
  'alert.detail.device': 'Device',
  'alert.detail.registered': 'Registered',
  'alert.detail.confirmedOn': 'Confirmed on',
  'alert.detail.status.active': 'Active',
  'alert.detail.status.resolved': 'Resolved',
  'alert.detail.status.confirmed': 'Confirmed',
  'alert.error.noAlerts': 'Could not load alerts.',
  'alert.error.noAlertDetail': 'Could not load the alert.',
  'alert.error.acknowledge': 'Could not confirm the alert.',
  'alert.success.acknowledge': 'Receipt confirmed successfully.',
  'alert.error.invalid': 'Invalid alert.',
  'alert.variable.temperature': 'Temperature',
  'alert.variable.soilHumidity': 'Soil Humidity',
  'alert.variable.soilPh': 'Soil pH',
};

// ═══════════════════════════════════════════════════════════════════════
//  SPANISH TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('AlertListComponent — i18n (Spanish)', () => {
  it('should show Spanish severity labels', async () => {
    const store = createMockAlertStore({
      alerts: signal([
        { id: 1, alertLevel: 'critical', title: 'Test', zoneName: 'Z1', plantationName: 'P1', label: 'Temp', acknowledged: false, createdAt: '2025-01-01', triggeredValue: 35, thresholdMin: 20, thresholdMax: 30 },
      ]),
      badgeCount: signal({ critical: 1, warning: 2, total: 5, unacknowledged: 3 }),
    });
    await setupListTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Critica');
    expect(el.textContent).toContain('Gestion de alertas');
  });

  it('should show Spanish tab labels and empty states', async () => {
    const store = createMockAlertStore({
      alerts: signal([]),
      activeTab: signal('active'),
      badgeCount: signal({ critical: 0, warning: 0, total: 0, unacknowledged: 0 }),
    });
    await setupListTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Activas');
    expect(el.textContent).toContain('Historial');
    expect(el.textContent).toContain('Sin alertas activas');
  });

  it('should show Spanish loading and error states', async () => {
    const store = createMockAlertStore({ alertsLoading: signal(true), alertsError: signal('') });
    await setupListTestBed('es', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cargando alertas');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  ENGLISH TESTS (Alert List)
// ═══════════════════════════════════════════════════════════════════════

describe('AlertListComponent — i18n (English)', () => {
  beforeAll(() => {
    loadTranslations(EN);
  });

  it('should show English severity labels in list', async () => {
    const store = createMockAlertStore({
      alerts: signal([
        { id: 1, alertLevel: 'critical', title: 'Test', zoneName: 'Z1', plantationName: 'P1', label: 'Temp', acknowledged: false, createdAt: '2025-01-01', triggeredValue: 35, thresholdMin: 20, thresholdMax: 30 },
      ]),
      badgeCount: signal({ critical: 1, warning: 2, total: 5, unacknowledged: 3 }),
    });
    await setupListTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Critical');
    expect(el.textContent).toContain('Alert Management');
  });

  it('should show English tab labels and empty states', async () => {
    const store = createMockAlertStore({
      alerts: signal([]),
      activeTab: signal('active'),
      badgeCount: signal({ critical: 0, warning: 0, total: 0, unacknowledged: 0 }),
    });
    await setupListTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Active');
    expect(el.textContent).toContain('History');
    expect(el.textContent).toContain('No active alerts');
  });

  it('should show English loading text', async () => {
    const store = createMockAlertStore({ alertsLoading: signal(true) });
    await setupListTestBed('en', store).compileComponents();
    const fixture = TestBed.createComponent(AlertListComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Loading alerts');
  });
});
