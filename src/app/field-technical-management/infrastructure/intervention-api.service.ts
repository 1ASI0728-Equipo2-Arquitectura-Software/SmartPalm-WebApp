import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** AgronomicInterventionResource (FTM docs). */
export interface AgronomicInterventionDto {
  id: number;
  sectorId: number;
  performedBy: string;
  description: string;
  executionDate: string;
  createdAt: string;
  recommendationId?: number | null;
}

/** RegisterInterventionResource (input). */
export interface RegisterInterventionRequest {
  description: string;
  performedBy: string;
  executionDate: string;
  originRecommendationId?: number | null;
}

/**
 * FieldTechnicalManagement — interventions by sector.
 *
 * POST/GET /api/v1/sectors/{sectorId}/interventions
 * GET      /api/v1/interventions/{id}
 *
 * originRecommendationId optional; if set must exist and be Published.
 */
@Injectable({ providedIn: 'root' })
export class InterventionApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  listBySector(sectorId: number): Observable<AgronomicInterventionDto[]> {
    return this.http
      .get<AgronomicInterventionDto[]>(`${this.api}/sectors/${sectorId}/interventions`)
      .pipe(map((rows) => (rows ?? []).map((r) => this.normalize(r))));
  }

  getById(interventionId: number): Observable<AgronomicInterventionDto> {
    return this.http
      .get<AgronomicInterventionDto>(`${this.api}/interventions/${interventionId}`)
      .pipe(map((r) => this.normalize(r)));
  }

  create(sectorId: number, body: RegisterInterventionRequest): Observable<AgronomicInterventionDto> {
    const payload: RegisterInterventionRequest = {
      description: body.description,
      performedBy: body.performedBy,
      executionDate: body.executionDate,
      originRecommendationId:
        body.originRecommendationId && body.originRecommendationId > 0
          ? body.originRecommendationId
          : null,
    };
    return this.http
      .post<AgronomicInterventionDto>(`${this.api}/sectors/${sectorId}/interventions`, payload)
      .pipe(map((r) => this.normalize(r)));
  }

  private normalize(r: AgronomicInterventionDto): AgronomicInterventionDto {
    return {
      id: r.id,
      sectorId: r.sectorId,
      performedBy: r.performedBy ?? '',
      description: r.description ?? '',
      executionDate: r.executionDate,
      createdAt: r.createdAt,
      recommendationId: r.recommendationId ?? null,
    };
  }
}
