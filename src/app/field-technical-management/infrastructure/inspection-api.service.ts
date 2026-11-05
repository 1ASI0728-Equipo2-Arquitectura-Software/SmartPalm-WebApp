import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FieldInspection, InspectionListResponse, Intervention } from '../domain/model/inspection.entity';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private readonly http = inject(HttpClient);

  list(params?: { plantationId?: number; page?: number; size?: number }): Observable<InspectionListResponse> {
    const query = new URLSearchParams();
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<InspectionListResponse>(`${environment.apiUrl}/inspections${suffix}`);
  }

  getById(id: number): Observable<FieldInspection> {
    return this.http.get<FieldInspection>(`${environment.apiUrl}/inspections/${id}`);
  }

  listInterventions(params?: { plantationId?: number; recommendationId?: number }): Observable<{ interventions: Intervention[] }> {
    const query = new URLSearchParams();
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.recommendationId !== undefined) query.set('recommendationId', String(params.recommendationId));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<{ interventions: Intervention[] }>(`${environment.apiUrl}/interventions${suffix}`);
  }
}
