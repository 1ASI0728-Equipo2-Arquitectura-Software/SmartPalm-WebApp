import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslationService } from '../../../../i18n/translation.service';
import { SubscriptionAndUserManagementStore } from '../../../application/subscription-and-user-management.store';
import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';

@Component({
  selector: 'app-plans',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './plans.component.html',
})
export class PlansComponent implements OnInit {
  private readonly store = inject(SubscriptionAndUserManagementStore);
  private readonly t = inject(TranslationService);

  readonly plans = this.store.plans;
  readonly currentSubscription = this.store.currentSubscription;
  readonly loading = this.store.plansLoading;
  readonly error = this.store.plansError;
  readonly isAgronomist = this.store.isAgronomist;
  readonly currentPlanId = this.store.currentPlanId;

  backDashboardLabel(): string {
    return this.t.translate('subscription.plans.backDashboard');
  }
  headingLabel(): string {
    return this.t.translate('subscription.plans.heading');
  }
  eyebrowLabel(): string {
    return this.t.translate('subscription.plans.eyebrow');
  }
  loadingLabel(): string {
    return this.t.translate('subscription.plans.loading');
  }
  mySubLabel(): string {
    return this.t.translate('subscription.plans.viewMySubscription');
  }
  catalogNote(): string {
    return this.t.translate('subscription.plans.catalogNote');
  }
  currentPlanBadgeLabel(): string {
    return this.t.translate('subscription.plans.badge.current');
  }
  currentActionLabel(): string {
    return this.t.translate('subscription.plans.actions.current');
  }
  contactAdminLabel(): string {
    return this.t.translate('subscription.plans.actions.contactAdmin');
  }

  subtitle(): string {
    return this.isAgronomist()
      ? this.t.translate('subscription.plans.subtitleAgronomist')
      : this.t.translate('subscription.plans.subtitleGrower');
  }

  billingLabel(cycle: string | undefined): string {
    return cycle === 'yearly'
      ? this.t.translate('subscription.plans.billing.yearly')
      : this.t.translate('subscription.plans.billing.monthly');
  }

  perMonthLabel(): string {
    return this.t.translate('subscription.plans.perMonth');
  }

  hectaresLimit(value: number | undefined): string {
    if (value == null) return this.t.translate('subscription.plans.limits.unlimited');
    return `${value} ${this.t.translate('subscription.plans.limits.hectaresShort')}`;
  }

  devicesLimit(value: number | undefined): string {
    if (value == null) return this.t.translate('subscription.plans.limits.unlimited');
    return `${value} ${this.t.translate('subscription.plans.limits.devices')}`;
  }

  historyLimit(value: number | undefined): string {
    if (value == null) return '—';
    return `${value} ${this.t.translate('subscription.plans.limits.history')}`;
  }

  featureText(feature: string): string {
    if (feature.startsWith('maxHectares:')) {
      const v = feature.split(':')[1];
      return v === 'unlimited'
        ? this.t.translate('subscription.plans.feature.hectaresUnlimited')
        : this.t.translate('subscription.plans.feature.hectares').replace('{{n}}', v);
    }
    if (feature.startsWith('maxSensors:')) {
      const v = feature.split(':')[1];
      return v === 'unlimited'
        ? this.t.translate('subscription.plans.feature.sensorsUnlimited')
        : this.t.translate('subscription.plans.feature.sensors').replace('{{n}}', v);
    }
    if (feature.startsWith('maxHistory:')) {
      const v = feature.split(':')[1];
      return this.t.translate('subscription.plans.feature.history').replace('{{n}}', v);
    }
    return feature;
  }

  isCurrent(plan: SubscriptionPlan): boolean {
    const id = this.currentPlanId();
    if (!id) return false;
    return plan.id.toLowerCase() === id.toLowerCase() || plan.name.toLowerCase() === id.toLowerCase();
  }

  ngOnInit(): void {
    this.store.loadPlans();
    this.store.loadCurrentSubscription();
  }
}
