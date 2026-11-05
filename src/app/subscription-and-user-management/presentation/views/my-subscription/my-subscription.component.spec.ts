import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MySubscriptionComponent } from './my-subscription.component';
import { SubscriptionAndUserManagementStore } from '../../../application/subscription-and-user-management.store';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({ template: '' })
class DummyComponent {}

const ES: Record<string, string> = {
  'subscription.mySubscription.backDashboard': 'Dashboard',
  'subscription.mySubscription.eyebrow': 'MI SUSCRIPCIÓN',
  'subscription.mySubscription.loading': 'Cargando...',
  'subscription.mySubscription.viewPlans': 'Ver planes',
  'subscription.mySubscription.paymentsHeading': 'Historial de pagos',
  'subscription.mySubscription.emptyPayments': 'Sin pagos',
  'subscription.mySubscription.price': 'Precio',
  'subscription.mySubscription.billingCycle': 'Ciclo',
  'subscription.mySubscription.validity': 'Vigencia',
  'subscription.mySubscription.daysRemaining': 'Días restantes',
  'subscription.mySubscription.daysRemainingHint': 'días del ciclo',
  'subscription.mySubscription.validityFromTo': 'hasta',
  'subscription.mySubscription.actionsEyebrow': 'Acciones',
  'subscription.mySubscription.limitsHeading': 'Límites del plan',
  'subscription.mySubscription.adminNote': 'Nota admin',
  'subscription.mySubscription.cancelConfirm': '¿Cancelar?',
  'subscription.mySubscription.payments.plan': 'Plan',
  'subscription.mySubscription.payments.period': 'Periodo',
  'subscription.mySubscription.payments.amount': 'Monto',
  'subscription.mySubscription.payments.status': 'Estado',
  'subscription.mySubscription.payments.date': 'Procesado',
  'subscription.mySubscription.paymentStatus.completed': 'Completado',
  'subscription.mySubscription.status.active': 'Plan activo',
  'subscription.mySubscription.subtitles.agronomist': 'Consulta tu plan',
  'subscription.mySubscription.actions.change': 'Cambiar de plan',
  'subscription.mySubscription.actions.changeHelp': 'Ver catálogo',
  'subscription.mySubscription.actions.cancel': 'Cancelar suscripción',
  'subscription.mySubscription.actions.cancelling': 'Cancelando...',
  'subscription.mySubscription.actions.cancelHelp': 'Finaliza tu plan actual.',
  'subscription.mySubscription.limitLabels.hectares': 'Hectáreas',
  'subscription.mySubscription.limitLabels.sensors': 'Sensores',
  'subscription.mySubscription.limitLabels.history': 'Historial',
  'subscription.plans.billing.monthly': 'Mensual',
  'subscription.plans.limits.unlimited': 'Ilimitado',
  'subscription.plans.limits.hectaresShort': 'hect.',
  'subscription.plans.limits.devices': 'sensores',
};

function setup() {
  const store = {
    subscription: signal({
      id: 'sub-3',
      userId: 3,
      planId: 'Seed',
      planName: 'Seed',
      status: 'active',
      maxHectares: 50,
      maxDevices: 20,
      usedHectares: 0,
      usedDevices: 0,
      startDate: '2026-07-10T07:37:40',
      endDate: '2026-08-10T07:37:40',
      autoRenew: false,
      paymentMethod: '—',
      daysRemaining: 30,
      price: 149,
      billingCycle: 'Monthly',
      currency: 'USD',
      maxReports: 3,
    }),
    subscriptionLoading: signal(false),
    subscriptionError: signal(''),
    actionLoading: signal(''),
    actionError: signal(''),
    actionSuccess: signal(''),
    payments: signal([
      {
        planName: 'Seed',
        periodStart: '2026-07-10',
        periodEnd: '2026-08-10',
        amount: 149,
        status: 'completed',
        processedAt: '2026-07-10T07:37:40',
      },
    ]),
    paymentsLoading: signal(false),
    isGrower: signal(false),
    isAgronomist: signal(true),
    loadSubscription: vi.fn(),
    cancel: vi.fn(),
  };

  return TestBed.configureTestingModule({
    imports: [MySubscriptionComponent],
    providers: [
      { provide: SubscriptionAndUserManagementStore, useValue: store },
      { provide: TranslationService, useValue: { translate: (k: string) => ES[k] ?? k } },
      provideRouter([
        { path: 'dashboard', component: DummyComponent },
        { path: 'subscription/plans', component: DummyComponent },
      ]),
    ],
  });
}

describe('MySubscriptionComponent', () => {
  it('shows plan, price and payments in Spanish', async () => {
    await setup().compileComponents();
    const fixture = TestBed.createComponent(MySubscriptionComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Seed');
    expect(text).toMatch(/Plan activo|active/i);
    expect(text).toContain('Historial de pagos');
    expect(text).toContain('Completado');
    expect(text).toContain('Hectáreas');
    expect(text).toContain('50');
  });
});
