import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdminApiService, AdminUserDto } from '../infrastructure/admin-api.service';
import { GlobalToastService } from '../../shared/infrastructure/global-toast.service';
import { TranslationService } from '../../i18n/translation.service';
import { AdminUserDeletionService } from './admin-user-deletion.service';

describe('AdminUserDeletionService', () => {
  const user: AdminUserDto = {
    id: 10,
    username: 'grower10',
    email: 'grower10@example.com',
    fullName: 'Grower Ten',
    role: 'PalmGrower',
  };
  let api: { deleteUser: ReturnType<typeof vi.fn>; getUserDeletionStatus: ReturnType<typeof vi.fn> };
  let toast: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let service: AdminUserDeletionService;

  beforeEach(() => {
    vi.useFakeTimers();
    api = { deleteUser: vi.fn(), getUserDeletionStatus: vi.fn() };
    toast = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AdminUserDeletionService,
        { provide: AdminApiService, useValue: api },
        { provide: GlobalToastService, useValue: toast },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    });
    service = TestBed.inject(AdminUserDeletionService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a success toast when the deletion completes', () => {
    api.deleteUser.mockReturnValue(of({ operationId: 'op-1', status: 'Pending' }));
    api.getUserDeletionStatus.mockReturnValue(of({ operationId: 'op-1', status: 'Completed' }));

    service.start(user);
    vi.advanceTimersByTime(0);

    expect(toast.showSuccess).toHaveBeenCalledWith(
      'User Grower Ten and all related data were successfully deleted.',
    );
    expect(service.lastResult()).toEqual({ userId: 10, status: 'completed' });
    expect(service.deletingUserId()).toBeNull();
  });

  it('shows an error toast when the backend reports a failed deletion', () => {
    api.deleteUser.mockReturnValue(of({ operationId: 'op-2', status: 'Pending' }));
    api.getUserDeletionStatus.mockReturnValue(of({
      operationId: 'op-2',
      status: 'Failed',
      error: 'Deletion failed in a service.',
    }));

    service.start(user);
    vi.advanceTimersByTime(0);

    expect(toast.showError).toHaveBeenCalledWith('Deletion failed in a service.');
    expect(service.lastResult()).toEqual({ userId: 10, status: 'failed' });
  });

  it('shows an error toast when the DELETE request fails', () => {
    api.deleteUser.mockReturnValue(throwError(() => new Error('Network error')));

    service.start(user);

    expect(toast.showError).toHaveBeenCalled();
    expect(service.lastResult()).toEqual({ userId: 10, status: 'error' });
  });
});
