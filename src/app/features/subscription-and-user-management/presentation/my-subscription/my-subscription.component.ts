import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Subscription } from '../../domain/subscription.model';
import { SubscriptionService } from '../../infrastructure/subscription-api.service';

@Component({
  selector: 'app-my-subscription',
  imports: [DatePipe, RouterLink],
  templateUrl: './my-subscription.component.html',
})
export class MySubscriptionComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);

  readonly subscription = signal<Subscription | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly actionLoading = signal('');
  readonly actionError = signal('');
  readonly actionSuccess = signal('');

  readonly isGrower = computed(() => this.subscription()?.segment !== 'agronomist');

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.subscriptionService
      .getMySubscription()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (subscription) => this.subscription.set(subscription),
        error: () => this.error.set('No tienes una suscripcion activa.'),
      });
  }

  renew(): void {
    this.actionLoading.set('renew');
    this.actionError.set('');
    this.actionSuccess.set('');

    this.subscriptionService
      .renew()
      .pipe(finalize(() => this.actionLoading.set('')))
      .subscribe({
        next: (res) => {
          this.actionSuccess.set(res.message);
          this.load();
        },
        error: () => this.actionError.set('Error al renovar la suscripcion.'),
      });
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
          this.actionSuccess.set(res.message);
          this.load();
        },
        error: () => this.actionError.set('Error al cancelar la renovacion.'),
      });
  }
}
