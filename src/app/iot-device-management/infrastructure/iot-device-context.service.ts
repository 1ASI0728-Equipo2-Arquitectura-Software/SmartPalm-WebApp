import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EdgeGatewayService } from './edge-gateway-api.service';

export interface IotDeviceContext {
  gatewayMac: string;
  deviceMac: string;
  /** True when values came from live /edge-gateways (+ devices), not only demo fallback. */
  resolvedFromApi: boolean;
}

/**
 * Resolves the active edge gateway + IoT device MACs from the live API.
 * Prefers environment.demo.* when they still exist on the backend; otherwise
 * uses the first gateway/device returned by Render (avoids hardcoded seed 404s).
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

    const fallback: IotDeviceContext = {
      gatewayMac: environment.demo.gatewayMac,
      deviceMac: environment.demo.deviceMac,
      resolvedFromApi: false,
    };

    if (!environment.features.iotStatus && !environment.features.sensors) {
      return of(fallback);
    }

    return this.edge.listGateways().pipe(
      catchError(() => of([])),
      switchMap((gateways) => {
        if (!gateways.length) {
          return of(fallback);
        }

        const preferredGw = environment.demo.gatewayMac?.toLowerCase() ?? '';
        const gateway =
          gateways.find((g) => g.mac?.toLowerCase() === preferredGw) ?? gateways[0];
        const gatewayMac = gateway.mac;

        return this.edge.getDevices(gatewayMac).pipe(
          map((result) => {
            const devices = result?.devices ?? [];
            const preferredDev = environment.demo.deviceMac?.toLowerCase() ?? '';
            const device =
              devices.find((d) => d.deviceMac?.toLowerCase() === preferredDev) ?? devices[0];
            return {
              gatewayMac,
              deviceMac: device?.deviceMac ?? environment.demo.deviceMac,
              resolvedFromApi: true,
            } satisfies IotDeviceContext;
          }),
          catchError(() =>
            of({
              gatewayMac,
              deviceMac: environment.demo.deviceMac,
              resolvedFromApi: true,
            } satisfies IotDeviceContext),
          ),
        );
      }),
      tap((ctx) => {
        this.cache = ctx;
      }),
      catchError(() => of(fallback)),
    );
  }

  clearCache(): void {
    this.cache = null;
  }
}
