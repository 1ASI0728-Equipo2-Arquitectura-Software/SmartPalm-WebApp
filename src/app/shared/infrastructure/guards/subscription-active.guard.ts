import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SubscriptionService } from '../../../subscription-and-user-management/infrastructure/subscription-and-user-management-api';

export const subscriptionActiveGuard: CanActivateFn = () => {
  const router = inject(Router);
  const subscriptionService = inject(SubscriptionService);

  return subscriptionService.getMySubscription().pipe(
    map((subscription) => {
      if (subscription.status === 'active') {
        return true;
      }

      return router.createUrlTree(['/subscription/me']);
    }),
    catchError(() => of(router.createUrlTree(['/subscription/me']))),
  );
};
