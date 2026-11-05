import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/infrastructure/auth.service';
import {
  CreateRecommendationRequest,
  Recommendation,
  RecommendationListResponse,
  RecommendationScope,
} from '../domain/model/recommendation.entity';
import {
  CreateRecommendationBackendBody,
  RecommendationBackendDto,
} from './recommendation.response';
import {
  composeRecommendationContent,
  recommendationFromBackend,
  toBackendStatusFilter,
} from './recommendation.assembler';

/**
 * AgronomicRecommendation API — sector / general contract (docs 2026-07-10).
 *
 * GET/POST  /sectors/{sectorId}/recommendations
 * GET/POST  /recommendations/general
 * GET/PATCH /recommendations/{recommendationId}
 * PATCH     /recommendations/{id}/approval
 * PATCH     /recommendations/{id}/publication
 */
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = environment.apiUrl;

  list(params?: {
    status?: string;
    sectorId?: number;
    scope?: RecommendationScope;
    agronomistId?: number;
    page?: number;
    size?: number;
    /** @deprecated use sectorId / scope */
    plantationId?: number;
  }): Observable<RecommendationListResponse> {
    const scope: RecommendationScope = params?.scope ?? 'sector';
    const sectorId =
      params?.sectorId ?? params?.plantationId ?? environment.demo.sectorId ?? 1;
    const status = toBackendStatusFilter(params?.status);

    let httpParams = new HttpParams();
    if (status) httpParams = httpParams.set('status', status);
    if (params?.agronomistId !== undefined) {
      httpParams = httpParams.set('agronomistId', String(params.agronomistId));
    }

    const url =
      scope === 'general'
        ? `${this.api}/recommendations/general`
        : `${this.api}/sectors/${sectorId}/recommendations`;

    return this.http.get<RecommendationBackendDto[]>(url, { params: httpParams }).pipe(
      map((items) => {
        const recommendations = (items ?? []).map((dto) =>
          recommendationFromBackend(dto, {
            sectorId: scope === 'general' ? null : sectorId,
            agronomistId: this.currentAgronomistId(),
          }),
        );
        return {
          totalElements: recommendations.length,
          totalPages: 1,
          page: 1,
          recommendations,
        };
      }),
    );
  }

  getById(id: number, _sectorId?: number): Observable<Recommendation> {
    return this.http.get<RecommendationBackendDto>(`${this.api}/recommendations/${id}`).pipe(
      map((dto) =>
        recommendationFromBackend(dto, {
          sectorId: environment.demo.sectorId ?? 1,
          agronomistId: this.currentAgronomistId(),
        }),
      ),
    );
  }

  create(request: CreateRecommendationRequest): Observable<Recommendation> {
    const agronomistId =
      request.agronomistId && request.agronomistId > 0
        ? request.agronomistId
        : this.currentAgronomistId();
    const content = composeRecommendationContent({
      title: request.title,
      description: request.description,
      recommendedAction: request.recommendedAction,
      priority: request.priority,
    });
    const body: CreateRecommendationBackendBody = {
      agronomistId,
      content,
      reportId: request.reportId ?? null,
    };

    const scope = request.scope ?? 'sector';
    const sectorId = request.sectorId ?? environment.demo.sectorId ?? 1;
    const url =
      scope === 'general'
        ? `${this.api}/recommendations/general`
        : `${this.api}/sectors/${sectorId}/recommendations`;

    return this.http.post<RecommendationBackendDto>(url, body).pipe(
      map((dto) =>
        recommendationFromBackend(dto, {
          sectorId: scope === 'general' ? null : sectorId,
          agronomistId,
        }),
      ),
    );
  }

  updateContent(id: number, content: string): Observable<Recommendation> {
    return this.http
      .patch<RecommendationBackendDto>(`${this.api}/recommendations/${id}`, { content })
      .pipe(
        map((dto) =>
          recommendationFromBackend(dto, {
            sectorId: environment.demo.sectorId ?? 1,
            agronomistId: this.currentAgronomistId(),
          }),
        ),
      );
  }

  approve(id: number, _sectorId?: number): Observable<Recommendation> {
    return this.http
      .patch<RecommendationBackendDto>(`${this.api}/recommendations/${id}/approval`, {})
      .pipe(
        map((dto) =>
          recommendationFromBackend(dto, {
            sectorId: environment.demo.sectorId ?? 1,
            agronomistId: this.currentAgronomistId(),
          }),
        ),
      );
  }

  publish(id: number, _sectorId?: number): Observable<Recommendation> {
    return this.http
      .patch<RecommendationBackendDto>(`${this.api}/recommendations/${id}/publication`, {})
      .pipe(
        map((dto) =>
          recommendationFromBackend(dto, {
            sectorId: environment.demo.sectorId ?? 1,
            agronomistId: this.currentAgronomistId(),
          }),
        ),
      );
  }

  private currentAgronomistId(): number {
    const fromUser = this.auth.user()?.id;
    if (fromUser && fromUser > 0) return fromUser;
    return environment.demo.agronomistId || 0;
  }
}
