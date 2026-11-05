import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status?: string;
}

export interface CreateAdminUserBody {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'Agronomist' | 'PalmGrower';
}

export interface AdminSubscriptionDto {
  planType?: string;
  planName?: string;
  price?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  billingCycle?: string;
  createdAt?: string;
  userId?: number;
  id?: number | string;
}

export interface AdminPlantationDto {
  id: number;
  name?: string;
  hectares?: number;
  status?: string;
  ownerId?: number;
  palmGrowerId?: number;
  address?: string;
  estimatedSensors?: number;
  installationMessage?: string;
}

export interface AdminPlantationDetailDto extends AdminPlantationDto {
  sectors?: {
    id?: number;
    name?: string;
    sectorName?: string;
    iotDeviceMacAddress?: string;
    status?: string;
  }[];
}

export interface AffiliationDto {
  agronomistId?: number;
  plantationId?: number;
  id?: number;
}

/**
 * Admin operations for agronomist desk + palm-grower provisioning
 * (mobile grower app is separate; this console designates grower assets).
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Users ──────────────────────────────────────────────
  listUsers(): Observable<AdminUserDto[]> {
    return this.http
      .get<AdminUserDto[]>(`${this.base}/admin/users`)
      .pipe(map((rows) => rows ?? []));
  }

  listGrowers(): Observable<AdminUserDto[]> {
    return this.listUsers().pipe(
      map((rows) =>
        rows.filter((u) => (u.role || '').toLowerCase().includes('grower')),
      ),
    );
  }

  listAgronomists(): Observable<AdminUserDto[]> {
    return this.listUsers().pipe(
      map((rows) =>
        rows.filter((u) => (u.role || '').toLowerCase().includes('agronom')),
      ),
    );
  }

  createUser(body: CreateAdminUserBody): Observable<AdminUserDto> {
    return this.http.post<AdminUserDto>(`${this.base}/admin/users`, body);
  }

  // ── Subscriptions ──────────────────────────────────────
  createSubscription(userId: number, planType: string): Observable<AdminSubscriptionDto> {
    return this.http.post<AdminSubscriptionDto>(`${this.base}/admin/subscriptions`, {
      userId,
      planType,
    });
  }

  processPayment(userId: number, amount: number): Observable<unknown> {
    return this.http.post(`${this.base}/admin/subscriptions/users/${userId}/payments`, {
      amount,
    });
  }

  /** Create subscription + payment (idempotent-ish: payment retried if sub exists). */
  activateAccess(userId: number, planType: string, amount: number): Observable<unknown> {
    return this.createSubscription(userId, planType).pipe(
      switchMap(() => this.processPayment(userId, amount)),
    );
  }

  listSubscriptions(): Observable<AdminSubscriptionDto[]> {
    return this.http
      .get<AdminSubscriptionDto[]>(`${this.base}/admin/subscriptions`)
      .pipe(map((rows) => rows ?? []));
  }

  // ── Plantations ────────────────────────────────────────
  listPlantations(): Observable<AdminPlantationDto[]> {
    return this.http
      .get<AdminPlantationDto[]>(`${this.base}/admin/plantations`)
      .pipe(map((rows) => rows ?? []));
  }

  getPlantation(id: number): Observable<AdminPlantationDetailDto> {
    return this.http.get<AdminPlantationDetailDto>(`${this.base}/admin/plantations/${id}`);
  }

  /**
   * Create plantation owned by a PalmGrower.
   * API POST /plantations always uses the JWT user as owner — so we sign-in as the grower
   * for this single request only (Bearer header), without replacing the admin session.
   */
  createPlantationForGrower(
    growerUsername: string,
    growerPassword: string,
    body: { name: string; hectares: number; address: string; coordinates?: string },
  ): Observable<AdminPlantationDto> {
    return this.http
      .post<{ userId: number; username: string; token: string }>(
        `${this.base}/authentication/sign-in`,
        { username: growerUsername.trim(), password: growerPassword },
      )
      .pipe(
        switchMap((auth) => {
          const headers = new HttpHeaders({
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          });
          return this.http.post<AdminPlantationDto>(
            `${this.base}/plantations`,
            {
              name: body.name,
              hectares: body.hectares,
              address: body.address,
              coordinates: body.coordinates ?? '',
            },
            { headers },
          );
        }),
      );
  }

  /**
   * Plantation owned by the authenticated admin (infra / field tools).
   * Prefer createPlantationForGrower when designating grower mobile assets.
   */
  createPlantation(body: {
    name: string;
    hectares: number;
    address: string;
    coordinates?: string;
  }): Observable<AdminPlantationDto> {
    return this.http.post<AdminPlantationDto>(`${this.base}/plantations`, {
      name: body.name,
      hectares: body.hectares,
      address: body.address,
      coordinates: body.coordinates ?? '',
    });
  }

  assignSector(
    plantationId: number,
    body: { iotDeviceMacAddress: string; sectorName: string },
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/plantations/${plantationId}/sectors`, body);
  }

  // ── Edge / IoT ─────────────────────────────────────────
  registerEdgeGateway(edgeMac: string, monitoringZoneId = 1): Observable<void> {
    return this.http.post<void>(`${this.base}/edge-gateways`, {
      edgeMac,
      monitoringZoneId,
    });
  }

  registerIotDevice(
    gatewayMac: string,
    body: { iotMac: string; plantationId: number },
  ): Observable<void> {
    return this.http.post<void>(
      `${this.base}/edge-gateways/${encodeURIComponent(gatewayMac)}/iot-devices`,
      body,
    );
  }

  // ── Affiliations (admin designates agronomist ↔ plantation) ──
  createAffiliation(agronomistId: number, plantationId: number): Observable<AffiliationDto> {
    return this.http.post<AffiliationDto>(`${this.base}/agronomists/plantation-affiliations`, {
      agronomistId,
      plantationId,
    });
  }

  listAffiliationsByAgronomist(agronomistId: number): Observable<AffiliationDto[]> {
    return this.http
      .get<AffiliationDto[]>(`${this.base}/agronomists/${agronomistId}/plantation-affiliations`)
      .pipe(map((rows) => rows ?? []));
  }
}
