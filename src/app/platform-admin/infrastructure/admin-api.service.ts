import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanType, PlatformUserRole } from '../../shared/domain/platform-contracts';

export interface AdminUserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status?: string;
}

export interface UserDeletionOperationDto {
  operationId: string;
  userId?: number | null;
  status: string;
  expectedServices: number;
  completedServices: number;
  requestedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

export interface CreateAdminUserBody {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: PlatformUserRole;
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

export interface AdminSubscriptionStatusDto extends AdminSubscriptionDto {
  userId: number;
  status: string;
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

export interface SectorResponse {
  id: number;
  name: string;
  iotDeviceMacAddress?: string | null;
  status?: string;
  createdAt?: string;
  activatedAt?: string | null;
}

export interface GatewayRegistrationResponse {
  gatewayMac: string;
  ownerUserId: number;
  cloudKey: string;
  createdAt: string;
}

export interface IotRegistrationResponse {
  iotMac: string;
  ownerUserId: number;
  plantationId: number;
  sectorId: number;
  bootstrapKey: string;
  createdAt: string;
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

  deleteUser(userId: number): Observable<UserDeletionOperationDto> {
    return this.http.delete<UserDeletionOperationDto>(`${this.base}/admin/users/${userId}`);
  }

  getUserDeletionStatus(operationId: string): Observable<UserDeletionOperationDto> {
    return this.http.get<UserDeletionOperationDto>(
      `${this.base}/admin/users/deletion-operations/${operationId}`,
    );
  }

  // ── Subscriptions ──────────────────────────────────────
  createSubscription(userId: number, planType: PlanType | string): Observable<AdminSubscriptionDto> {
    return this.http.post<AdminSubscriptionDto>(`${this.base}/admin/subscriptions`, {
      userId,
      planType,
    });
  }

  getSubscriptionForUser(userId: number): Observable<AdminSubscriptionStatusDto> {
    return this.listSubscriptions().pipe(
      switchMap((subscriptions) => {
        const subscription = subscriptions.find((item) => item.userId === userId);
        if (subscription) {
          return of({
            ...subscription,
            userId,
            status: subscription.status ?? 'Inactive',
          });
        }
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
              url: `${this.base}/admin/subscriptions`,
            }),
        );
      }),
    );
  }

  processPayment(userId: number, amount: number): Observable<unknown> {
    return this.http.post(`${this.base}/admin/subscriptions/users/${userId}/payments`, {
      amount,
    });
  }

  /** Create subscription + payment when the target account has no subscription yet. */
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

  /** Create an administrator-designated plantation owned by the selected PalmGrower. */
  createPlantation(body: {
    name: string;
    hectares: number;
    address: string;
    coordinates?: string;
    palmGrowerId?: number;
  }): Observable<AdminPlantationDto> {
    return this.http.post<AdminPlantationDto>(`${this.base}/plantations`, {
      name: body.name,
      hectares: body.hectares,
      address: body.address,
      coordinates: body.coordinates ?? '',
      ...(body.palmGrowerId ? { palmGrowerId: body.palmGrowerId } : {}),
    });
  }

  assignSector(
    plantationId: number,
    body: { iotDeviceMacAddress?: string | null; sectorName: string },
  ): Observable<SectorResponse> {
    return this.http.post<SectorResponse>(
      `${this.base}/admin/plantations/${plantationId}/sectors`,
      body,
    );
  }

  // ── Edge / IoT ─────────────────────────────────────────
  registerEdgeGateway(
    edgeMac: string,
    ownerUserId: number,
    monitoringZoneId = 1,
  ): Observable<GatewayRegistrationResponse> {
    return this.http.post<GatewayRegistrationResponse>(`${this.base}/admin/edge-gateways`, {
      edgeMac,
      ownerUserId,
      monitoringZoneId,
    });
  }

  registerIotDevice(
    gatewayMac: string,
    body: {
      iotMac: string;
      ownerUserId: number;
      plantationId: number;
      sectorId: number;
    },
  ): Observable<IotRegistrationResponse> {
    return this.http.post<IotRegistrationResponse>(
      `${this.base}/admin/edge-gateways/${encodeURIComponent(gatewayMac)}/iot-devices`,
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
