import { Component, inject } from '@angular/core';
import { GlobalToastService } from '../../infrastructure/global-toast.service';
import { TranslationService } from '../../../i18n/translation.service';

@Component({
  selector: 'app-global-toast',
  templateUrl: './global-toast.component.html',
  styles: [
    `
      :host {
        display: contents;
      }

      .global-toast {
        animation: globalToastEnter 180ms ease-out;
      }

      .global-toast-fading {
        animation: globalToastFadeOut 500ms ease-in forwards;
      }

      @keyframes globalToastEnter {
        from {
          opacity: 0;
          transform: translateY(-10px) translateX(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0) translateX(0);
        }
      }

      @keyframes globalToastFadeOut {
        from {
          opacity: 1;
          transform: translateY(0) translateX(0);
        }
        to {
          opacity: 0;
          transform: translateY(-6px) translateX(8px);
        }
      }
    `,
  ],
})
export class GlobalToastComponent {
  private readonly toastService = inject(GlobalToastService);
  private readonly translations = inject(TranslationService);

  readonly toast = this.toastService.toast;

  get closeLabel(): string {
    return this.translations.translate('notifications.close');
  }

  dismiss(): void {
    this.toastService.dismiss();
  }
}
