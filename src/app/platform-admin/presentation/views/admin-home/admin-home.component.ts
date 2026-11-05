import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../i18n/translation.service';

@Component({
  selector: 'app-admin-home',
  imports: [RouterLink],
  templateUrl: './admin-home.component.html',
})
export class AdminHomeComponent {
  private readonly t = inject(TranslationService);

  get title(): string {
    return this.t.translate('admin.home.title');
  }
  get subtitle(): string {
    return this.t.translate('admin.home.subtitle');
  }

  steps() {
    return [
      {
        n: '1',
        title: this.t.translate('admin.home.step1Title'),
        desc: this.t.translate('admin.home.step1Desc'),
        link: '/admin/users',
        cta: this.t.translate('admin.home.step1Cta'),
      },
      {
        n: '2',
        title: this.t.translate('admin.home.step2Title'),
        desc: this.t.translate('admin.home.step2Desc'),
        link: '/admin/growers',
        cta: this.t.translate('admin.home.step2Cta'),
      },
      {
        n: '3',
        title: this.t.translate('admin.home.step3Title'),
        desc: this.t.translate('admin.home.step3Desc'),
        link: '/admin/field',
        cta: this.t.translate('admin.home.step3Cta'),
      },
    ];
  }
}
