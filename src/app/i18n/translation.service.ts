import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LocaleService, Locale } from './locale.service';

export type TranslationDict = Record<string, any>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly localeService = inject(LocaleService);

  private readonly _translations = signal<TranslationDict>({});
  private readonly _loading = signal(false);
  private readonly _loadedLocale = signal<Locale | null>(null);

  readonly translations = this._translations.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly currentLocale = this.localeService.locale;

  constructor() {
    // Auto-reload translations when locale changes
    effect(() => {
      const locale = this.localeService.locale();
      this.loadTranslations(locale);
    });
  }

  translate(key: string): string {
    const dict = this._translations();
    const value = this.getNestedValue(dict, key);
    return typeof value === 'string' ? value : key;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  private loadTranslations(locale: Locale): void {
    // Always reload on locale change so hot-updated JSON is picked up in dev.
    if (this._loadedLocale() === locale && Object.keys(this._translations()).length > 0) {
      return;
    }

    this._loading.set(true);

    this.http.get<TranslationDict>(`assets/i18n/${locale}.json`).subscribe({
      next: (dict) => {
        this._translations.set(dict);
        this._loadedLocale.set(locale);
        this._loading.set(false);
      },
      error: () => {
        // Fallback to empty dict; translate() will return the key itself
        this._translations.set({});
        this._loadedLocale.set(locale);
        this._loading.set(false);
      },
    });
  }
}
