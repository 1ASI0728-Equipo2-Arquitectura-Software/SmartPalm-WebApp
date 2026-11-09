import { Injectable, inject, signal } from '@angular/core';
import { Subscription, finalize, last, switchMap, take, takeWhile, timer } from 'rxjs';
import {
  AdminApiService,
  AdminUserDto,
  UserDeletionOperationDto,
} from '../infrastructure/admin-api.service';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error-message';
import { GlobalToastService } from '../../shared/infrastructure/global-toast.service';
import { TranslationService } from '../../i18n/translation.service';

export type UserDeletionResultStatus = 'completed' | 'failed' | 'timeout' | 'error';

export interface UserDeletionResult {
  userId: number;
  status: UserDeletionResultStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminUserDeletionService {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(GlobalToastService);
  private readonly translations = inject(TranslationService);
  private operationSubscription: Subscription | null = null;

  private readonly _deletingUserId = signal<number | null>(null);
  private readonly _lastResult = signal<UserDeletionResult | null>(null);

  readonly deletingUserId = this._deletingUserId.asReadonly();
  readonly lastResult = this._lastResult.asReadonly();

  start(user: AdminUserDto): void {
    if (this._deletingUserId() !== null) return;

    this._deletingUserId.set(user.id);
    this._lastResult.set(null);
    const displayName = user.fullName || user.username;

    this.operationSubscription = this.api
      .deleteUser(user.id)
      .pipe(
        switchMap((operation) => this.poll(operation)),
        finalize(() => {
          this._deletingUserId.set(null);
          this.operationSubscription = null;
        }),
      )
      .subscribe({
        next: (operation) => {
          const status = operation.status.toLowerCase();
          if (status === 'completed') {
            this._lastResult.set({ userId: user.id, status: 'completed' });
            this.toast.showSuccess(
              this.message('admin.users.deleteToastSuccess', `User ${displayName} and all related data were successfully deleted.`)
                .replace('{{name}}', displayName),
            );
            return;
          }

          if (status === 'failed') {
            this.notifyFailure(user.id, 'failed', operation.error || this.message(
              'admin.users.deleteToastError',
              'The user deletion could not be completed.',
            ));
            return;
          }

          this.notifyFailure(
            user.id,
            'timeout',
            this.message('admin.users.deleteToastTimeout', 'The user deletion is taking longer than expected.'),
          );
        },
        error: (error: unknown) => {
          this.notifyFailure(
            user.id,
            'error',
            getApiErrorMessage(
              error,
              this.message('admin.users.deleteToastError', 'The user deletion could not be completed.'),
            ),
          );
        },
      });
  }

  private poll(operation: UserDeletionOperationDto) {
    return timer(0, 1000).pipe(
      take(60),
      switchMap(() => this.api.getUserDeletionStatus(operation.operationId)),
      takeWhile((current) => current.status.toLowerCase() === 'pending', true),
      last(),
    );
  }

  private notifyFailure(userId: number, status: 'failed' | 'timeout' | 'error', message: string): void {
    this._lastResult.set({ userId, status });
    this.toast.showError(message);
  }

  private message(key: string, fallback: string): string {
    const translated = this.translations.translate(key);
    return translated === key ? fallback : translated;
  }
}
