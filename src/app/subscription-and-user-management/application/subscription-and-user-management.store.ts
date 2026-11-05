import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/domain/user.model';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { TranslationService } from '../../i18n/translation.service';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error-message';
import { Subscription, SubscriptionPayment } from '../domain/model/subscription.entity';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { UserService } from '../infrastructure/user-api.service';
import { SubscriptionService } from '../infrastructure/subscription-api.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionAndUserManagementStore {
  private readonly userService = inject(UserService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly authService = inject(AuthService);
  private readonly t = inject(TranslationService);

  readonly user = signal<User | null>(null);
  readonly profileLoading = signal(false);
  readonly profileSaving = signal(false);
  readonly profileError = signal('');

  readonly subscription = signal<Subscription | null>(null);
  readonly subscriptionLoading = signal(false);
  readonly subscriptionError = signal('');
  readonly actionLoading = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');
  readonly payments = signal<SubscriptionPayment[]>([]);
  readonly paymentsLoading = signal(false);

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly plansLoading = signal(false);
  readonly plansError = signal('');
  /** Alias for plans view current plan badge */
  readonly currentSubscription = signal<Subscription | null>(null);
  readonly subscribing = signal('');
  readonly upgrading = signal('');

  readonly currentPlanId = computed(
    () => this.subscription()?.planId ?? this.currentSubscription()?.planId ?? '',
  );
  readonly isAgronomist = computed(() => this.authService.user()?.role === 'agronomist');
  readonly isGrower = computed(() => this.authService.user()?.role === 'palm_grower');

  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileError.set('');
    this.userService
      .getProfile()
      .pipe(finalize(() => this.profileLoading.set(false)))
      .subscribe({
        next: (u) => this.user.set(u),
        error: () => this.profileError.set(this.t.translate('subscription.profile.error.load')),
      });
  }

  updateProfile(
    data: Partial<Pick<User, 'fullName' | 'phone' | 'region' | 'city' | 'avatarUrl'>>,
  ): Observable<User> {
    this.profileSaving.set(true);
    this.profileError.set('');
    return this.userService.updateProfile(data).pipe(
      tap({
        next: (u) => this.user.set(u),
        error: () => this.profileError.set(this.t.translate('subscription.profile.error.save')),
      }),
      finalize(() => this.profileSaving.set(false)),
    );
  }

  /** Loads subscription + payment history for /subscription/me */
  loadSubscription(): void {
    this.subscriptionLoading.set(true);
    this.subscriptionError.set('');
    this.actionError.set('');
    if (!environment.features.subscriptionApi) {
      this.subscription.set(null);
      this.subscriptionLoading.set(false);
      this.subscriptionError.set('subscription.mySubscription.error.unavailable');
      return;
    }

    this.paymentsLoading.set(true);
    forkJoin({
      sub: this.subscriptionService.getMySubscription(),
      payments: this.subscriptionService.listPayments().pipe(catchError(() => of([]))),
    })
      .pipe(
        finalize(() => {
          this.subscriptionLoading.set(false);
          this.paymentsLoading.set(false);
        }),
      )
      .subscribe({
        next: ({ sub, payments }) => {
          this.subscription.set(sub);
          this.currentSubscription.set(sub);
          this.payments.set(payments ?? []);
        },
        error: (err: unknown) =>
          this.subscriptionError.set(
            getApiErrorMessage(err, this.t.translate('subscription.mySubscription.error.load')),
          ),
      });
  }

  /**
   * User renew is not available on live IAM (POST /subscriptions/payments → 405).
   * Kept as explicit messaging for the UI.
   */
  renew(): void {
    this.actionLoading.set('renew');
    this.actionError.set('');
    this.actionSuccess.set('');
    this.actionLoading.set('');
    this.actionError.set(this.t.translate('subscription.mySubscription.error.renewUnavailable'));
  }

  cancel(): void {
    this.actionLoading.set('cancel');
    this.actionError.set('');
    this.actionSuccess.set('');
    this.subscriptionService
      .cancel()
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: (res) => {
          this.actionSuccess.set(
            res?.message || this.t.translate('subscription.mySubscription.cancelSuccess'),
          );
          this.loadSubscription();
        },
        error: (err: unknown) =>
          this.actionError.set(
            getApiErrorMessage(err, this.t.translate('subscription.mySubscription.error.cancel')),
          ),
      });
  }

  loadPlans(): void {
    this.plansLoading.set(true);
    this.plansError.set('');
    this.subscriptionService
      .getPlans()
      .pipe(finalize(() => this.plansLoading.set(false)))
      .subscribe({
        next: (p) => this.plans.set(p),
        error: (err: unknown) =>
          this.plansError.set(
            getApiErrorMessage(err, this.t.translate('subscription.plans.error.load')),
          ),
      });
  }

  loadCurrentSubscription(): void {
    this.subscriptionService.getMySubscription().subscribe({
      next: (sub) => {
        this.currentSubscription.set(sub);
        this.subscription.set(sub);
      },
      error: () => {
        this.currentSubscription.set(null);
      },
    });
  }

  /**
   * Self-subscribe not available to agronomist on live API (admin creates subs).
   */
  subscribe(_planId: string, _paymentMethod: string): Observable<Subscription> {
    this.plansError.set(this.t.translate('subscription.plans.error.subscribeUnavailable'));
    return new Observable((sub) => {
      sub.error({ status: 405, message: 'Subscribe unavailable' });
    });
  }

  upgrade(_planId: string): Observable<Subscription> {
    this.plansError.set(this.t.translate('subscription.plans.error.changeUnavailable'));
    return new Observable((sub) => {
      sub.error({ status: 405, message: 'Upgrade unavailable' });
    });
  }
}
