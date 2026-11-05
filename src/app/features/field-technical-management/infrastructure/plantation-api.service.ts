import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePlantationRequest, Plantation, UpdatePlantationRequest } from '../domain/plantation.model';
import { CreateZoneRequest, UpdateZoneRequest, Zone } from '../domain/zone.model';

@Injectable({ providedIn: 'root' })
export class PlantationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/plantations`;

  list(): Observable<Plantation[]> {
    return this.http.get<Plantation[]>(this.api);
  }

  getById(id: number): Observable<Plantation> {
    return this.http.get<Plantation>(`${this.api}/${id}`);
  }

  create(request: CreatePlantationRequest): Observable<Plantation> {
    return this.http.post<Plantation>(this.api, request);
  }

  update(id: number, request: UpdatePlantationRequest): Observable<Plantation> {
    return this.http.put<Plantation>(`${this.api}/${id}`, request);
  }

  listZones(plantationId: number): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.api}/${plantationId}/zones`);
  }

  getZone(plantationId: number, zoneId: number): Observable<Zone> {
    return this.http.get<Zone>(`${this.api}/${plantationId}/zones/${zoneId}`);
  }

  createZone(plantationId: number, request: CreateZoneRequest): Observable<Zone> {
    return this.http.post<Zone>(`${this.api}/${plantationId}/zones`, request);
  }

  updateZone(plantationId: number, zoneId: number, request: UpdateZoneRequest): Observable<Zone> {
    return this.http.put<Zone>(`${this.api}/${plantationId}/zones/${zoneId}`, request);
  }
}
