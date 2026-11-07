import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalToastService } from './global-toast.service';

describe('GlobalToastService', () => {
  let service: GlobalToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new GlobalToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a success toast and fades it before dismissing it after five seconds', () => {
    service.showSuccess('User deleted');

    expect(service.toast()).toMatchObject({ type: 'success', message: 'User deleted', isFading: false });

    vi.advanceTimersByTime(4499);
    expect(service.toast()?.isFading).toBe(false);

    vi.advanceTimersByTime(1);
    expect(service.toast()?.isFading).toBe(true);

    vi.advanceTimersByTime(499);
    expect(service.toast()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(service.toast()).toBeNull();
  });

  it('shows errors, replaces previous messages and supports manual dismissal', () => {
    service.showSuccess('Previous');
    service.showError('Deletion failed');

    expect(service.toast()).toMatchObject({ type: 'error', message: 'Deletion failed' });

    service.dismiss();

    expect(service.toast()).toBeNull();
  });
});
