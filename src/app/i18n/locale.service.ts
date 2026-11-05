import { Injectable, signal, computed } from '@angular/core';

export type Locale = 'es' | 'en';

const STORAGE_KEY = 'app-locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly _locale = signal<Locale>(this.loadInitial());

  readonly locale = this._locale.asReadonly();

  readonly isSpanish = computed(() => this._locale() === 'es');
  readonly isEnglish = computed(() => this._locale() === 'en');

  setLocale(locale: Locale): void {
    this._locale.set(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage may be unavailable (SSR, private mode, etc.)
    }
  }

  toggle(): void {
    const next: Locale = this._locale() === 'es' ? 'en' : 'es';
    this.setLocale(next);
  }

  private loadInitial(): Locale {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'es';
  }
}
