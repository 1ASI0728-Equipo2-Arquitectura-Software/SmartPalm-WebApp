import { Injectable, signal } from '@angular/core';

export type GlobalToastType = 'success' | 'error';

export interface GlobalToastMessage {
  id: number;
  type: GlobalToastType;
  message: string;
  isFading: boolean;
}

@Injectable({ providedIn: 'root' })
export class GlobalToastService {
  private readonly _toast = signal<GlobalToastMessage | null>(null);
  private nextId = 0;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly toast = this._toast.asReadonly();

  showSuccess(message: string): void {
    this.show('success', message);
  }

  showError(message: string): void {
    this.show('error', message);
  }

  dismiss(): void {
    this.clearTimers();
    this._toast.set(null);
  }

  private show(type: GlobalToastType, message: string): void {
    this.clearTimers();

    const id = ++this.nextId;
    this._toast.set({ id, type, message, isFading: false });

    this.fadeTimer = setTimeout(() => {
      if (this._toast()?.id !== id) return;
      this._toast.update((toast) => (toast ? { ...toast, isFading: true } : toast));
    }, 4500);

    this.dismissTimer = setTimeout(() => {
      if (this._toast()?.id === id) this._toast.set(null);
    }, 5000);
  }

  private clearTimers(): void {
    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer);
    if (this.dismissTimer !== null) clearTimeout(this.dismissTimer);
    this.fadeTimer = null;
    this.dismissTimer = null;
  }
}
