import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../i18n/translation.service';
import { SubscriptionAndUserManagementStore } from '../../../application/subscription-and-user-management.store';

@Component({
  selector: 'app-my-subscription',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  templateUrl: './my-subscription.component.html',
})
export class MySubscriptionComponent implements OnInit {
  private readonly store = inject(SubscriptionAndUserManagementStore);
  private readonly t = inject(TranslationService);

  readonly subscription = this.store.subscription;
  readonly loading = this.store.subscriptionLoading;
  readonly error = this.store.subscriptionError;
  readonly actionLoading = this.store.actionLoading;
  readonly actionError = this.store.actionError;
  readonly actionSuccess = this.store.actionSuccess;
  readonly payments = this.store.payments;
  readonly paymentsLoading = this.store.paymentsLoading;
  readonly isGrower = this.store.isGrower;
  readonly isAgronomist = this.store.isAgronomist;

  backDashboardLabel(): string {
    return this.t.translate('subscription.mySubscription.backDashboard');
  }
  eyebrowLabel(): string {
    return this.t.translate('subscription.mySubscription.eyebrow');
  }
  loadingLabel(): string {
    return this.t.translate('subscription.mySubscription.loading');
  }
  viewPlansLabel(): string {
    return this.t.translate('subscription.mySubscription.viewPlans');
  }
  paymentsHeading(): string {
    return this.t.translate('subscription.mySubscription.paymentsHeading');
  }
  emptyPayments(): string {
    return this.t.translate('subscription.mySubscription.emptyPayments');
  }
  priceLabel(): string {
    return this.t.translate('subscription.mySubscription.price');
  }
  cycleLabel(): string {
    return this.t.translate('subscription.mySubscription.billingCycle');
  }
  validityLabel(): string {
    return this.t.translate('subscription.mySubscription.validity');
  }
  daysRemainingLabel(): string {
    return this.t.translate('subscription.mySubscription.daysRemaining');
  }
  daysRemainingHintLabel(): string {
    return this.t.translate('subscription.mySubscription.daysRemainingHint');
  }
  validityUntilLabel(): string {
    return this.t.translate('subscription.mySubscription.validityFromTo');
  }
  actionsEyebrowLabel(): string {
    return this.t.translate('subscription.mySubscription.actionsEyebrow');
  }
  limitsHeading(): string {
    return this.t.translate('subscription.mySubscription.limitsHeading');
  }
  adminNote(): string {
    return this.t.translate('subscription.mySubscription.adminNote');
  }
  cancelConfirm(): string {
    return this.t.translate('subscription.mySubscription.cancelConfirm');
  }
  colPlan(): string {
    return this.t.translate('subscription.mySubscription.payments.plan');
  }
  colPeriod(): string {
    return this.t.translate('subscription.mySubscription.payments.period');
  }
  colAmount(): string {
    return this.t.translate('subscription.mySubscription.payments.amount');
  }
  colStatus(): string {
    return this.t.translate('subscription.mySubscription.payments.status');
  }
  colDate(): string {
    return this.t.translate('subscription.mySubscription.payments.date');
  }

  errorLabel(): string {
    const e = this.error();
    if (!e) return '';
    // key or raw API message
    const translated = this.t.translate(e);
    return translated === e && e.startsWith('subscription.') ? e : translated;
  }

  subtitle(): string {
    return this.isGrower()
      ? this.t.translate('subscription.mySubscription.subtitles.grower')
      : this.t.translate('subscription.mySubscription.subtitles.agronomist');
  }

  statusLabel(status: string): string {
    const key = `subscription.mySubscription.status.${status}`;
    const t = this.t.translate(key);
    return t === key ? status : t;
  }

  paymentStatusLabel(status: string): string {
    const key = `subscription.mySubscription.paymentStatus.${status}`;
    const t = this.t.translate(key);
    return t === key ? status : t;
  }

  billingLabel(cycle: string | undefined): string {
    if (!cycle) return '—';
    const c = cycle.toLowerCase();
    if (c.includes('year')) return this.t.translate('subscription.plans.billing.yearly');
    if (c.includes('month')) return this.t.translate('subscription.plans.billing.monthly');
    return cycle;
  }

  hectaresLabel(value: number | undefined): string {
    if (value == null || value === 0) return this.t.translate('subscription.plans.limits.unlimited');
    return `${value} ${this.t.translate('subscription.plans.limits.hectaresShort')}`;
  }

  devicesLabel(value: number | undefined): string {
    if (value == null || value === 0) return this.t.translate('subscription.plans.limits.unlimited');
    return `${value} ${this.t.translate('subscription.plans.limits.devices')}`;
  }

  actionLabel(action: 'cancel' | 'change', loadingKey: string): string {
    if (action === 'cancel') {
      return this.actionLoading() === 'cancel'
        ? this.t.translate('subscription.mySubscription.actions.cancelling')
        : this.t.translate('subscription.mySubscription.actions.cancel');
    }
    return this.t.translate('subscription.mySubscription.actions.change');
  }

  actionHelp(action: 'cancel' | 'change'): string {
    return action === 'cancel'
      ? this.t.translate('subscription.mySubscription.actions.cancelHelp')
      : this.t.translate('subscription.mySubscription.actions.changeHelp');
  }

  limitLabel(key: 'hectares' | 'sensors' | 'history'): string {
    return this.t.translate(`subscription.mySubscription.limitLabels.${key}`);
  }

  ngOnInit(): void {
    this.store.loadSubscription();
  }

  cancel(): void {
    if (typeof window !== 'undefined' && !window.confirm(this.cancelConfirm())) {
      return;
    }
    this.store.cancel();
  }
}
