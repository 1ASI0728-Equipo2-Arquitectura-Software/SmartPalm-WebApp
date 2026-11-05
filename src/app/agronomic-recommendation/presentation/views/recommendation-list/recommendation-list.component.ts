import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TranslationService } from '../../../../i18n/translation.service';
import { AgronomicRecommendationStore } from '../../../application/agronomic-recommendation.store';
import { RecommendationScope } from '../../../domain/model/recommendation.entity';

@Component({
  selector: 'app-recommendation-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './recommendation-list.component.html',
})
export class RecommendationListComponent implements OnInit {
  readonly store = inject(AgronomicRecommendationStore);
  private readonly t = inject(TranslationService);

  readonly sectorId = environment.demo.sectorId ?? 1;

  /** Workflow tab: inbox (non-published) vs published. */
  readonly activeTab = signal<'pending' | 'published'>('pending');
  /** API scope: sector recommendations vs general. */
  readonly activeScope = signal<RecommendationScope>('sector');

  readonly filteredRecommendations = computed(() => {
    const recs = this.store.recommendations();
    if (this.activeTab() === 'pending') {
      return recs.filter((r) => r.status !== 'published');
    }
    return recs.filter((r) => r.status === 'published');
  });

  readonly priorityColors: Record<string, string> = {
    critical: 'var(--color-danger)',
    high: 'var(--color-warning)',
    medium: 'var(--color-accent-cyan)',
    low: 'var(--color-success)',
  };

  readonly statusColors: Record<string, string> = {
    pending_review: 'var(--color-warning)',
    approved: 'var(--color-accent-cyan)',
    published: 'var(--color-success)',
  };

  get badgeLabel(): string {
    return this.store.isAgronomist()
      ? this.t.translate('rec.list.badge.agronomist')
      : this.t.translate('rec.list.badge.grower');
  }

  get headingText(): string {
    return this.t.translate('rec.list.heading');
  }

  get subtitleText(): string {
    return this.store.isAgronomist()
      ? this.t.translate('rec.list.subtitle.agronomist')
      : this.t.translate('rec.list.subtitle.grower');
  }

  get counterLabel(): string {
    return this.t.translate('rec.list.counter');
  }

  get tabPendingLabel(): string {
    return this.t.translate('rec.list.tab.pending');
  }

  get tabPublishedLabel(): string {
    return this.t.translate('rec.list.tab.published');
  }

  get scopeSectorLabel(): string {
    return this.t.translate('rec.list.scope.sector');
  }

  get scopeGeneralLabel(): string {
    return this.t.translate('rec.list.scope.general');
  }

  get contextLabel(): string {
    return this.activeScope() === 'general'
      ? this.t.translate('rec.list.context.general')
      : this.t.translate('rec.list.context.sector').replace('{{id}}', String(this.sectorId));
  }

  get newButtonLabel(): string {
    return this.t.translate('rec.list.newButton');
  }

  get loadingText(): string {
    return this.t.translate('rec.list.loading');
  }

  get emptyPendingTitle(): string {
    return this.t.translate('rec.list.emptyPending');
  }

  get emptyPendingDesc(): string {
    return this.t.translate('rec.list.emptyPendingDesc');
  }

  get emptyPublishedTitle(): string {
    return this.t.translate('rec.list.emptyPublished');
  }

  get emptyPublishedDesc(): string {
    return this.t.translate('rec.list.emptyPublishedDesc');
  }

  get createFirstLabel(): string {
    return this.t.translate('rec.list.createFirst');
  }

  get noIdHint(): string {
    return this.t.translate('rec.list.noIdHint');
  }

  get backDashboardLabel(): string {
    return this.t.translate('rec.list.backDashboard');
  }

  get recommendedActionLabel(): string {
    return this.t.translate('rec.list.recommendedAction');
  }

  get createdAtLabel(): string {
    return this.t.translate('rec.list.createdAt');
  }

  get refreshLabel(): string {
    return this.t.translate('rec.list.refresh');
  }

  typeLabel(type: string): string {
    const key = type?.toLowerCase() === 'general' ? 'rec.list.type.general' : 'rec.list.type.sector';
    return this.t.translate(key);
  }

  priorityLabel(key: string): string {
    const labels: Record<string, string> = {
      critical: this.t.translate('rec.list.priority.critical'),
      high: this.t.translate('rec.list.priority.high'),
      medium: this.t.translate('rec.list.priority.medium'),
      low: this.t.translate('rec.list.priority.low'),
    };
    return labels[key] ?? key;
  }

  statusLabel(key: string): string {
    const labels: Record<string, string> = {
      pending_review: this.t.translate('rec.list.status.pendingReview'),
      approved: this.t.translate('rec.list.status.approved'),
      published: this.t.translate('rec.list.status.published'),
    };
    return labels[key] ?? key;
  }

  ngOnInit(): void {
    this.load();
  }

  selectTab(tab: 'pending' | 'published'): void {
    this.activeTab.set(tab);
  }

  selectScope(scope: RecommendationScope): void {
    if (this.activeScope() === scope) return;
    this.activeScope.set(scope);
    this.load();
  }

  refresh(): void {
    this.load();
  }

  private load(): void {
    this.store.loadRecommendations({
      scope: this.activeScope(),
      sectorId: this.sectorId,
      size: 50,
    });
  }
}
