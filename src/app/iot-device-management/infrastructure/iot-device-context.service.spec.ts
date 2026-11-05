import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { IotDeviceContextService } from './iot-device-context.service';

describe('IotDeviceContextService', () => {
  let service: IotDeviceContextService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IotDeviceContextService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IotDeviceContextService);
    http = TestBed.inject(HttpTestingController);
    service.clearCache();
  });

  it('uses first live gateway/device when demo MACs are absent', () => {
    const liveGw = '24:6f:28:a1:74:8c';
    const liveDev = '30:76:f5:a5:88:f8';

    service.resolve().subscribe((ctx) => {
      expect(ctx.gatewayMac).toBe(liveGw);
      expect(ctx.deviceMac).toBe(liveDev);
      expect(ctx.resolvedFromApi).toBe(true);
    });

    const gwReq = http.expectOne(`${api}/edge-gateways`);
    gwReq.flush([{ mac: liveGw, isConnected: true, status: 'Connected' }]);

    const devReq = http.expectOne(
      `${api}/edge-gateways/${encodeURIComponent(liveGw)}/devices`,
    );
    devReq.flush({ gatewayMac: liveGw, devices: [{ deviceMac: liveDev }] });
  });

  it('falls back to demo MACs when gateway list is empty', () => {
    service.resolve().subscribe((ctx) => {
      expect(ctx.gatewayMac).toBe(environment.demo.gatewayMac);
      expect(ctx.deviceMac).toBe(environment.demo.deviceMac);
      expect(ctx.resolvedFromApi).toBe(false);
    });

    http.expectOne(`${api}/edge-gateways`).flush([]);
  });

  it('returns cache on second resolve without extra HTTP', () => {
    const liveGw = 'aa:bb:cc:00:00:99';
    const liveDev = 'aa:bb:cc:dd:ee:99';

    service.resolve().subscribe();
    http.expectOne(`${api}/edge-gateways`).flush([
      { mac: liveGw, isConnected: true, status: 'Connected' },
    ]);
    http
      .expectOne(`${api}/edge-gateways/${encodeURIComponent(liveGw)}/devices`)
      .flush({ gatewayMac: liveGw, devices: [{ deviceMac: liveDev }] });

    service.resolve().subscribe((ctx) => {
      expect(ctx.deviceMac).toBe(liveDev);
    });
    http.expectNone(`${api}/edge-gateways`);
  });
});
