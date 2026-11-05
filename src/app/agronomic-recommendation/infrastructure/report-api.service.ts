import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report, ReportListResponse } from '../domain/model/report.entity';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reports`;

  list(params?: {
    status?: string;
    plantationId?: number;
    page?: number;
    size?: number;
  }): Observable<ReportListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.plantationId !== undefined) query.set('plantationId', String(params.plantationId));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.http.get<ReportListResponse>(`${this.api}${suffix}`);
  }

  getById(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.api}/${id}`);
  }

  generateDraft(plantationId: number): Observable<Report> {
    return this.http.post<Report>(`${this.api}/generate-draft`, { plantationId });
  }

  publish(id: number): Observable<Report> {
    return this.http.put<Report>(`${this.api}/${id}/publish`, {});
  }
}
