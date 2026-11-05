import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SubscriptionPlan } from '../domain/subscription-plan.model';
import { Subscription } from '../domain/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/subscriptions`;

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.api}/plans`);
  }

  getMySubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.api}/me`);
  }

  subscribe(planId: string, paymentMethod: string): Observable<Subscription> {
    return this.http.post<Subscription>(this.api, { planId, paymentMethod });
  }

  renew(): Observable<{ id: string; status: string; autoRenew: boolean; endDate: string; message: string }> {
    return this.http.put<{ id: string; status: string; autoRenew: boolean; endDate: string; message: string }>(
      `${this.api}/me/renew`,
      {},
    );
  }

  cancel(): Observable<{ id: string; status: string; autoRenew: boolean; endDate: string; message: string }> {
    return this.http.put<{ id: string; status: string; autoRenew: boolean; endDate: string; message: string }>(
      `${this.api}/me/cancel`,
      {},
    );
  }

  upgrade(planId: string): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.api}/me/upgrade`, { planId });
  }
}
