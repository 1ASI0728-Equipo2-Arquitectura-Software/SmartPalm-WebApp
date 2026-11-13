import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DeviceContext } from '../../../shared/domain/platform-contracts';
import { EdgeGatewayService } from './edge-gateway-api.service';

export interface IotDeviceContext extends DeviceContext {
  gatewayMac: string;
  deviceMac: string;
  /** True because this context is always resolved from the live API. */
  resolvedFromApi: true;
}

/**
 * Resolves the active gateway/device and its ownership context from the API.
 * A real session never falls back to seeded MACs or identifiers.
 */
@Injectable({ providedIn: 'root' })
export class IotDeviceContextService {
  private readonly edge = inject(EdgeGatewayService);
  private cache: IotDeviceContext | null = null;

  /** Cached resolve (refresh=false) or force re-fetch (refresh=true). */
  resolve(options?: { refresh?: boolean }): Observable<IotDeviceContext> {
    if (this.cache && !options?.refresh) {
      return of(this.cache);
    }

    if (!environment.features.iotStatus && !environment.features.sensors) {
      return throwError(() => new Error('Live IoT monitoring is disabled.'));
    }

    return this.edge.listGateways().pipe(
      switchMap((gateways) => {
        if (!gateways.length) {
          return throwError(() => new Error('No registered edge gateways were found.'));
        }

        const gateway = gateways[0];
        const gatewayMac = gateway.mac;

        return this.edge.getDevices(gatewayMac).pipe(
          map((result) => {
            const devices = result?.devices ?? [];
            // The API gateway applies account ownership from the authenticated JWT.
            // Do not re-scope by a client-side user id or expose another account's data.
            const device = devices.find((d) => d.isActive !== false) ?? devices[0];
            if (!device) {
              throw new Error(`Gateway ${gatewayMac} has no registered IoT devices for this account.`);
            }
            return {
              gatewayMac,
              deviceMac: device.deviceMac,
              iotMac: device.deviceMac,
              ownerUserId: device.ownerUserId ?? 0,
              plantationId: device.plantationId ?? 0,
              sectorId: device.sectorId ?? 0,
              isProvisioned: device.isProvisioned ?? false,
              isActive: device.isActive ?? true,
              provisionedAt: device.provisionedAt,
              revokedAt: device.revokedAt,
              resolvedFromApi: true,
            } satisfies IotDeviceContext;
          }),
        );
      }),
      tap((ctx) => {
        this.cache = ctx;
      }),
      switchMap((ctx) =>
        ctx.isActive
          ? of(ctx)
          : throwError(() => new Error('The registered IoT device is inactive.')),
      ),
    );
  }

  clearCache(): void {
    this.cache = null;
  }
}
