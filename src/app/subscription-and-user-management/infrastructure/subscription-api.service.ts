import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';
import { Subscription, SubscriptionPayment } from '../domain/model/subscription.entity';
import {
  mapPaymentFromBackend,
  mapPlanFromBackend,
  mapSubscriptionFromBackend,
  SubscriptionBackendDto,
  SubscriptionPaymentBackendDto,
  SubscriptionPlanBackendDto,
} from './subscription.response';

/**
 * User-facing IAM subscription endpoints (docs):
 * GET    /api/v1/subscriptions
 * DELETE /api/v1/subscriptions
 * GET    /api/v1/subscriptions/payments
 * GET    /api/v1/subscriptions/plans  (public)
 *
 * Create/upgrade/renew are admin-side (POST /admin/subscriptions, payments).
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = `${environment.apiUrl}/subscriptions`;

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http
      .get<SubscriptionPlanBackendDto[]>(`${this.api}/plans`)
      .pipe(map((rows) => (rows ?? []).map((dto) => mapPlanFromBackend(dto))));
  }

  /**
   * GET /subscriptions — enrich limits from plan catalog when API omits them.
   */
  getMySubscription(): Observable<Subscription> {
    const userId = this.auth.user()?.id ?? 0;
    return forkJoin({
      sub: this.http.get<SubscriptionBackendDto>(this.api),
      plans: this.getPlans().pipe(catchError(() => of([] as SubscriptionPlan[]))),
    }).pipe(map(({ sub, plans }) => mapSubscriptionFromBackend(sub ?? {}, userId, plans)));
  }

  listPayments(): Observable<SubscriptionPayment[]> {
    return this.http
      .get<SubscriptionPaymentBackendDto[]>(`${this.api}/payments`)
      .pipe(map((rows) => (rows ?? []).map((dto) => mapPaymentFromBackend(dto))));
  }

  /** DELETE /api/v1/subscriptions */
  cancel(): Observable<{ message?: string; status?: string }> {
    return this.http.delete<{ message?: string; status?: string }>(this.api);
  }
}
