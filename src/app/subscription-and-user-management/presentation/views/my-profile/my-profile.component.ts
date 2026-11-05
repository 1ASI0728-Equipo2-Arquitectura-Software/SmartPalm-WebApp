import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../i18n/translation.service';
import { SubscriptionAndUserManagementStore } from '../../../application/subscription-and-user-management.store';

@Component({
  selector: 'app-my-profile',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './my-profile.component.html',
})
export class MyProfileComponent implements OnInit {
  private readonly store = inject(SubscriptionAndUserManagementStore);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslationService);

  readonly user = this.store.user;
  readonly loading = this.store.profileLoading;
  readonly saving = this.store.profileSaving;
  readonly error = this.store.profileError;

  editing = false;

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    // Optional: seed agronomist has empty phone; backend profile is session-local.
    phone: [''],
    region: [''],
    city: [''],
  });

  regions = ['Ucayali', 'San Martin', 'Loreto'];

  backDashboardLabel(): string { return this.t.translate('subscription.profile.backDashboard'); }
  loadingLabel(): string { return this.t.translate('subscription.profile.loading'); }

  editBtnLabel(): string { return this.t.translate('subscription.profile.editBtn'); }
  editHeadingLabel(): string { return this.t.translate('subscription.profile.editing.heading'); }
  fullNameLabel(): string { return this.t.translate('subscription.profile.editing.fullName'); }
  phoneLabel(): string { return this.t.translate('subscription.profile.editing.phone'); }
  regionLabel(): string { return this.t.translate('subscription.profile.editing.region'); }
  cityLabel(): string { return this.t.translate('subscription.profile.editing.city'); }
  saveLabel(): string { return this.t.translate('subscription.profile.editing.save'); }
  savingLabel(): string { return this.t.translate('subscription.profile.editing.saving'); }
  cancelLabel(): string { return this.t.translate('subscription.profile.editing.cancel'); }
  emailLabel(): string { return this.t.translate('subscription.profile.fields.email'); }
  phoneFieldLabel(): string { return this.t.translate('subscription.profile.fields.phone'); }
  locationLabel(): string { return this.t.translate('subscription.profile.fields.location'); }
  subscriptionFieldLabel(): string { return this.t.translate('subscription.profile.fields.subscription'); }
  planStatusLabel(): string { return this.t.translate('subscription.profile.fields.planStatus'); }
  noActivePlanLabel(): string { return this.t.translate('subscription.profile.noActivePlan'); }
  untilLabel(): string { return this.t.translate('subscription.profile.until'); }
  errorFallbackLabel(): string { return this.t.translate('subscription.profile.error.load'); }

  statusLabel(status: string | undefined): string {
    const key = `subscription.profile.statusShort.${status ?? 'inactive'}`;
    return this.t.translate(key);
  }

  roleLabel(role: string | undefined): string {
    if (role === 'palm_grower') return this.t.translate('subscription.profile.role.palm_grower');
    if (role === 'agronomist') return this.t.translate('subscription.profile.role.agronomist');
    return '';
  }

  ngOnInit(): void {
    this.store.loadProfile();
  }

  startEdit(): void {
    const u = this.user();
    if (!u) return;
    this.form.patchValue({
      fullName: u.fullName,
      phone: u.phone,
      region: u.region,
      city: u.city,
    });
    this.editing = true;
    this.store.profileError.set('');
  }

  cancelEdit(): void {
    this.editing = false;
    this.store.profileError.set('');
  }

  save(): void {
    if (this.form.invalid) return;
    this.store.updateProfile(this.form.getRawValue()).subscribe({
      next: () => {
        this.editing = false;
      },
    });
  }
}
