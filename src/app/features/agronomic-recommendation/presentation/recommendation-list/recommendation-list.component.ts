import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../shared/infrastructure/auth.service';
import { Recommendation } from '../../domain/recommendation.model';
import { RecommendationService } from '../../infrastructure/recommendation-api.service';

@Component({
  selector: 'app-recommendation-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './recommendation-list.component.html',
})
export class RecommendationListComponent implements OnInit {
  private readonly recommendationService = inject(RecommendationService);
  private readonly authService = inject(AuthService);

  readonly allRecommendations = signal<Recommendation[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly activeTab = signal<'pending' | 'published'>('published');

  readonly isAgronomist = computed(() => this.authService.currentUser?.role === 'agronomist');

  readonly filteredRecommendations = computed(() => {
    const recs = this.allRecommendations();
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

  readonly priorityLabels: Record<string, string> = {
    critical: 'Critica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  readonly statusColors: Record<string, string> = {
    draft: 'var(--color-text-muted)',
    pending_review: 'var(--color-warning)',
    approved: 'var(--color-accent-cyan)',
    published: 'var(--color-success)',
  };

  readonly statusLabels: Record<string, string> = {
    draft: 'Borrador',
    pending_review: 'Pendiente',
    approved: 'Aprobada',
    published: 'Publicada',
  };

  ngOnInit(): void {
    this.load();
  }

  selectTab(tab: 'pending' | 'published'): void {
    this.activeTab.set(tab);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    const params = this.isAgronomist() ? { size: 50 } : { status: 'published', size: 50 };

    this.recommendationService
      .list(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.allRecommendations.set(response.recommendations),
        error: () => this.error.set('No se pudieron cargar las recomendaciones.'),
      });
  }
}
