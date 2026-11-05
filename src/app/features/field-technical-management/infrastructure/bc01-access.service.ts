import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { SubscriptionService } from '../../subscription-and-user-management/infrastructure/subscription-api.service';
import { Subscription } from '../../subscription-and-user-management/domain/subscription.model';

export type Bc01WriteAccess = {
  subscription: Subscription | null;
  canWrite: boolean;
  message: string;
  planName: string;
  usedHectares: number;
  maxHectares: number;
  hectaresRemaining: number;
  hectareLimitReached: boolean;
};

@Injectable({ providedIn: 'root' })
export class Bc01AccessService {
  private readonly subscriptionService = inject(SubscriptionService);

  loadWriteAccess(): Observable<Bc01WriteAccess> {
    return this.subscriptionService.getMySubscription().pipe(
      map((subscription) => {
        const isActive = subscription.status === 'active';
        const limitReached = isActive && subscription.usedHectares >= subscription.maxHectares;

        return {
          subscription,
          canWrite: isActive,
          message: isActive
            ? ''
            : 'Necesitas una suscripcion activa para realizar cambios en plantaciones y dispositivos.',
          planName: subscription.planName,
          usedHectares: subscription.usedHectares,
          maxHectares: subscription.maxHectares,
          hectaresRemaining: Math.max(0, subscription.maxHectares - subscription.usedHectares),
          hectareLimitReached: limitReached,
        };
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of({
            subscription: null,
            canWrite: false,
            message: 'Necesitas una suscripcion activa para realizar cambios en plantaciones y dispositivos.',
            planName: '',
            usedHectares: 0,
            maxHectares: 0,
            hectaresRemaining: 0,
            hectareLimitReached: false,
          });
        }

        return of({
          subscription: null,
          canWrite: false,
          message: 'No se pudo validar el estado de tu suscripcion en este momento.',
          planName: '',
          usedHectares: 0,
          maxHectares: 0,
          hectaresRemaining: 0,
          hectareLimitReached: false,
        });
      }),
    );
  }
}
