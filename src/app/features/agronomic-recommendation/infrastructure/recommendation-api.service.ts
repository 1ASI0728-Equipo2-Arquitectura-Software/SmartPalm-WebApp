import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRecommendationRequest, Recommendation, RecommendationListResponse } from '../domain/recommendation.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/recommendations`;

  list(params?: {
    status?: string;
    plantationId?: number;
    page?: number;
    size?: number;
  }): Observable<RecommendationListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<RecommendationListResponse>(`${this.api}${suffix}`);
  }

  getById(id: number): Observable<Recommendation> {
    return this.http.get<Recommendation>(`${this.api}/${id}`);
  }

  create(request: CreateRecommendationRequest): Observable<Recommendation> {
    return this.http.post<Recommendation>(this.api, request);
  }

  approve(id: number): Observable<Recommendation> {
    return this.http.put<Recommendation>(`${this.api}/${id}/approve`, {});
  }

  publish(id: number): Observable<Recommendation> {
    return this.http.put<Recommendation>(`${this.api}/${id}/publish`, {});
  }
}
