import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { TranslationService } from '../../../../i18n/translation.service';
import { RecommendationScope } from '../../../domain/model/recommendation.entity';

@Component({
  selector: 'app-recommendation-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recommendation-form.component.html',
})
export class RecommendationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly store = inject(AgronomicRecommendationStore);
  private readonly t = inject(TranslationService);

  readonly defaultSectorId = environment.demo.sectorId ?? 1;

  readonly form = this.fb.nonNullable.group({
    scope: ['sector' as RecommendationScope, [Validators.required]],
    sectorId: [this.defaultSectorId, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    recommendedAction: [''],
    priority: ['medium' as 'low' | 'medium' | 'high' | 'critical', [Validators.required]],
  });

  get backLabel(): string { return this.t.translate('rec.form.back'); }
  get loadingText(): string { return this.t.translate('rec.form.loading'); }
  get titleText(): string { return this.t.translate('rec.form.title'); }
  get subtitleText(): string { return this.t.translate('rec.form.subtitle'); }
  get scopeLabel(): string { return this.t.translate('rec.form.scope'); }
  get scopeSectorLabel(): string { return this.t.translate('rec.form.scopeSector'); }
  get scopeGeneralLabel(): string { return this.t.translate('rec.form.scopeGeneral'); }
  get sectorLabel(): string { return this.t.translate('rec.form.sector'); }
  get sectorHelp(): string { return this.t.translate('rec.form.sectorHelp'); }
  get titleFieldLabel(): string { return this.t.translate('rec.form.titleInput'); }
  get titlePlaceholder(): string { return this.t.translate('rec.form.titlePlaceholder'); }
  get descriptionLabel(): string { return this.t.translate('rec.form.description'); }
  get descriptionPlaceholder(): string { return this.t.translate('rec.form.descriptionPlaceholder'); }
  get actionLabel(): string { return this.t.translate('rec.form.recommendedAction'); }
  get actionOptionalLabel(): string { return this.t.translate('rec.form.actionOptional'); }
  get actionPlaceholder(): string { return this.t.translate('rec.form.actionPlaceholder'); }
  get priorityLabel(): string { return this.t.translate('rec.form.priority'); }
  get priorityInTextLabel(): string { return this.t.translate('rec.form.priorityInText'); }
  get saveDraftLabel(): string { return this.t.translate('rec.form.save'); }
  get savingLabel(): string { return this.t.translate('rec.form.saving'); }
  get cancelLabel(): string { return this.t.translate('rec.form.cancel'); }

  priorityOptionLabel(level: string): string {
    const map: Record<string, string> = {
      low: this.t.translate('rec.form.priorityLow'),
      medium: this.t.translate('rec.form.priorityMedium'),
      high: this.t.translate('rec.form.priorityHigh'),
      critical: this.t.translate('rec.form.priorityCritical'),
    };
    return map[level] ?? level;
  }

  ngOnInit(): void {
    this.store.prepareForm();
    this.form.controls.scope.valueChanges.subscribe((scope) => {
      if (scope === 'general') {
        this.form.controls.sectorId.clearValidators();
      } else {
        this.form.controls.sectorId.setValidators([Validators.required, Validators.min(1)]);
      }
      this.form.controls.sectorId.updateValueAndValidity();
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const scope = raw.scope;
    const sectorId = scope === 'general' ? null : Number(raw.sectorId) || this.defaultSectorId;

    if (scope === 'sector' && (!sectorId || sectorId <= 0)) {
      this.form.controls.sectorId.setErrors({ min: true });
      this.form.markAllAsTouched();
      return;
    }

    this.store
      .createRecommendation({
        scope,
        sectorId,
        title: raw.title,
        description: raw.description,
        recommendedAction: raw.recommendedAction || '',
        priority: raw.priority,
      })
      .subscribe({
        next: (rec) => {
          if (rec.id > 0) this.router.navigate(['/recomendaciones', rec.id]);
          else this.router.navigate(['/recomendaciones']);
        },
      });
  }
}
