import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EdgeGatewayService } from './edge-gateway-api.service';

describe('EdgeGatewayService — sensor / IoT contract', () => {
  let service: EdgeGatewayService;
  let http: HttpTestingController;
  const api = environment.apiUrl;
  const deviceMac = environment.demo.deviceMac;
  const gatewayMac = environment.demo.gatewayMac;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EdgeGatewayService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EdgeGatewayService);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists edge gateways', () => {
    service.listGateways().subscribe((rows) => {
      expect(rows[0].mac).toBe(gatewayMac);
      expect(rows[0].isConnected).toBe(false);
    });
    const req = http.expectOne(`${api}/edge-gateways`);
    expect(req.request.method).toBe('GET');
    req.flush([{ mac: gatewayMac, isConnected: false, status: 'Disconnected' }]);
  });

  it('lists thresholds for device', () => {
    service.listThresholds(deviceMac).subscribe((rows) => {
      expect(rows[0].type).toBe('Temperature');
    });
    const req = http.expectOne(
      `${api}/devices/${encodeURIComponent(deviceMac)}/thresholds`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        edgeMac: gatewayMac,
        iotMac: deviceMac,
        min: 15,
        max: 35,
        description: 'Temp',
        type: 'Temperature',
      },
    ]);
  });

  it('patches threshold', () => {
    service
      .updateThreshold({ type: 'Temperature', min: 15, max: 35, description: 'ok' }, deviceMac)
      .subscribe();
    const req = http.expectOne(
      `${api}/devices/${encodeURIComponent(deviceMac)}/thresholds`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.type).toBe('Temperature');
    req.flush(null);
  });

  it('gets sector health', () => {
    service.getSectorHealth(1).subscribe((h) => {
      expect(h.sectorId).toBe(1);
      expect(h.status).toBe(1);
    });
    const req = http.expectOne(`${api}/sectors/1/health`);
    req.flush({
      sectorId: 1,
      status: 1,
      sensorDetails: [
        {
          sensorType: 'Temperature',
          value: 40,
          minThreshold: 15,
          maxThreshold: 35,
          isExceeded: true,
        },
      ],
    });
  });
});
